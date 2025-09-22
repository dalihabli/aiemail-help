// Using a free embedding API (Hugging Face or similar)
// For now, we'll create a simple mock embedding for development
export async function getEmbedding(text: string) {
    try {
        // Using a simple hash-based embedding for development
        // In production, you'd want to use a proper embedding service
        const textHash = text.replace(/\n/g, ' ');
        const embedding = new Array(384).fill(0).map((_, i) => {
            return Math.sin(textHash.charCodeAt(i % textHash.length) * i * 0.1) * 0.5;
        });
        
        return embedding;
    } catch (error) {
        console.log('error creating embedding', error)
        throw error
    }
}

