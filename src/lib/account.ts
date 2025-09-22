import axios from "axios";
import type { EmailAddress, EmailMessage, SyncResponse, SyncUpdatedResponse } from "@/types";

export class Account {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async getMessages(pageToken?: string) {
        const params = new URLSearchParams({
            maxResults: '50', // Reduced from 500 to avoid rate limits
            ...(pageToken && { pageToken })
        });

        try {
            const response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                timeout: 30000 // 30 second timeout
            });
            
            return response.data;
        } catch (error) {
            if (error.response?.status === 429) {
                console.log('Rate limited, waiting 2 seconds...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Retry once
                const response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                    },
                    timeout: 30000
                });
                return response.data;
            }
            throw error;
        }
    }

    private async getMessage(messageId: string) {
        try {
            const response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                params: {
                    format: 'full'
                },
                timeout: 30000
            });
            
            return response.data;
        } catch (error) {
            if (error.response?.status === 429) {
                console.log(`Rate limited on message ${messageId}, waiting 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Retry once
                const response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                    },
                    params: {
                        format: 'full'
                    },
                    timeout: 30000
                });
                return response.data;
            }
            throw error;
        }
    }

    private convertGmailToEmailMessage(gmailMessage: any): EmailMessage {
        const headers = gmailMessage.payload?.headers || [];
        
        const getHeader = (name: string) => 
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        // Helper function to parse email addresses
        const parseEmailAddress = (emailStr: string) => {
            if (!emailStr) return { name: '', address: '' };
            
            // Parse "Name <email@domain.com>" format
            const match = emailStr.match(/^(.*?)\s*<(.+)>$/);
            if (match) {
                return {
                    name: match[1].trim().replace(/^["']|["']$/g, ''), // Remove quotes
                    address: match[2].trim()
                };
            }
            
            // Just email address without name
            return {
                name: '',
                address: emailStr.trim()
            };
        };

        // Helper function to parse multiple email addresses
        const parseEmailAddresses = (emailStr: string) => {
            if (!emailStr) return [];
            
            // Split by comma and parse each address
            return emailStr.split(',').map(addr => parseEmailAddress(addr.trim())).filter(addr => addr.address);
        };

        // Extract body content
        let body = '';
        if (gmailMessage.payload?.body?.data) {
            body = Buffer.from(gmailMessage.payload.body.data, 'base64').toString();
        } else if (gmailMessage.payload?.parts) {
            // Look for HTML or text parts
            const htmlPart = gmailMessage.payload.parts.find((part: any) => 
                part.mimeType === 'text/html');
            const textPart = gmailMessage.payload.parts.find((part: any) => 
                part.mimeType === 'text/plain');
            
            const bodyPart = htmlPart || textPart;
            if (bodyPart?.body?.data) {
                body = Buffer.from(bodyPart.body.data, 'base64').toString();
            }
        }

        // Convert Gmail labelIds to our sysLabels format
        const labelIds = gmailMessage.labelIds || [];
        const sysLabels: Array<"junk" | "trash" | "sent" | "inbox" | "unread" | "flagged" | "important" | "draft"> = [];
        
        // Map Gmail labels to our system labels
        if (labelIds.includes('INBOX')) sysLabels.push('inbox');
        if (labelIds.includes('SENT')) sysLabels.push('sent');
        if (labelIds.includes('DRAFT')) sysLabels.push('draft');
        if (labelIds.includes('UNREAD')) sysLabels.push('unread');
        if (labelIds.includes('IMPORTANT')) sysLabels.push('important');
        if (labelIds.includes('SPAM')) sysLabels.push('junk');
        if (labelIds.includes('TRASH')) sysLabels.push('trash');
        if (labelIds.includes('STARRED')) sysLabels.push('flagged');

        return {
            id: gmailMessage.id,
            threadId: gmailMessage.threadId,
            createdTime: new Date(parseInt(gmailMessage.internalDate)).toISOString(),
            lastModifiedTime: new Date(parseInt(gmailMessage.internalDate)).toISOString(),
            sentAt: getHeader('Date') || new Date(parseInt(gmailMessage.internalDate)).toISOString(),
            receivedAt: new Date(parseInt(gmailMessage.internalDate)).toISOString(),
            internetMessageId: getHeader('Message-ID'),
            subject: getHeader('Subject'),
            sysLabels: sysLabels,
            keywords: [],
            sysClassifications: [],
            sensitivity: 'normal' as const,
            from: parseEmailAddress(getHeader('From')),
            to: parseEmailAddresses(getHeader('To')),
            cc: parseEmailAddresses(getHeader('Cc')),
            bcc: parseEmailAddresses(getHeader('Bcc')),
            replyTo: parseEmailAddresses(getHeader('Reply-To')),
            hasAttachments: false, // TODO: Check for attachments
            body: body,
            snippet: gmailMessage.snippet || '',
            labelIds: labelIds,
            read: !labelIds.includes('UNREAD'),
            internalDate: gmailMessage.internalDate
        };
    }
    
    async getUpdatedEmails({ pageToken }: { deltaToken?: string, pageToken?: string }) {
        const messagesResponse = await this.getMessages(pageToken);
        
        if (!messagesResponse.messages) {
            return {
                records: [],
                nextPageToken: null,
                nextDeltaToken: null
            };
        }

        // Fetch full message details for each message
        const messages = await Promise.all(
            messagesResponse.messages.map(async (msg: any) => {
                const fullMessage = await this.getMessage(msg.id);
                return this.convertGmailToEmailMessage(fullMessage);
            })
        );

        return {
            records: messages,
            nextPageToken: messagesResponse.nextPageToken || null,
            nextDeltaToken: null // Gmail doesn't use delta tokens in the same way
        };
    }


    async performInitialSync() {
        try {
            let allEmails: EmailMessage[] = [];
            let pageToken: string | null = null;

            // Fetch all emails by paginating through Gmail API
            do {
                const response = await this.getUpdatedEmails({ pageToken: pageToken || undefined });
                allEmails = allEmails.concat(response.records);
                pageToken = response.nextPageToken;
                
                // Add a longer delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } while (pageToken);

            console.log('Initial sync completed, we have synced', allEmails.length, 'emails');

            return {
                emails: allEmails,
                deltaToken: null // Gmail doesn't use delta tokens in the same way as Aurinko
            };
        } catch (error) {
            console.error('Error during initial sync:', error);
            throw error;
        }
    }
    async sendEmail({
        from,
        subject,
        body,
        inReplyTo,
        references,
        threadId,
        to,
        cc,
        bcc,
        replyTo

    }:{ 
        from: EmailAddress
        subject: string,
        body: string,
        inReplyTo?: string,
        threadId?: string,
        references?: string,
        to: EmailAddress[],
        cc?: EmailAddress[],
        bcc?: EmailAddress[],
        replyTo?: EmailAddress
    }) {
        try {
            // Convert email addresses to string format
            const toStr = Array.isArray(to) ? to.map(addr => typeof addr === 'string' ? addr : `${addr.name} <${addr.email}>`).join(', ') : to;
            const ccStr = cc?.map(addr => typeof addr === 'string' ? addr : `${addr.name} <${addr.email}>`).join(', ') || '';
            const bccStr = bcc?.map(addr => typeof addr === 'string' ? addr : `${addr.name} <${addr.email}>`).join(', ') || '';
            const fromStr = typeof from === 'string' ? from : `${from.name} <${from.email}>`;
            const replyToStr = replyTo ? (typeof replyTo === 'string' ? replyTo : `${replyTo.name} <${replyTo.email}>`) : '';

            // Construct the email message in RFC 2822 format
            let emailContent = `From: ${fromStr}\r\n`;
            emailContent += `To: ${toStr}\r\n`;
            if (ccStr) emailContent += `Cc: ${ccStr}\r\n`;
            if (bccStr) emailContent += `Bcc: ${bccStr}\r\n`;
            if (replyToStr) emailContent += `Reply-To: ${replyToStr}\r\n`;
            emailContent += `Subject: ${subject}\r\n`;
            if (inReplyTo) emailContent += `In-Reply-To: ${inReplyTo}\r\n`;
            if (references) emailContent += `References: ${references}\r\n`;
            emailContent += `Content-Type: text/html; charset=utf-8\r\n`;
            emailContent += `\r\n${body}`;

            // Base64 encode the email content
            const encodedMessage = Buffer.from(emailContent).toString('base64url');

            const requestBody: any = {
                raw: encodedMessage
            };

            if (threadId) {
                requestBody.threadId = threadId;
            }

            const response = await axios.post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', requestBody, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('Email sent via Gmail API', response.data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error sending email:', JSON.stringify(error.response?.data, null, 2));
            } else {
                console.error('Unexpected error sending email:', error);
            }
            throw error;
        }
    }
    }

    
