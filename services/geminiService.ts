// FIX: Updated the import path to use the correct @google/genai package.
import { GoogleGenAI } from "@google/genai";
import type { Post } from '../types';

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (ai) {
        return ai;
    }
    // Fallback to process.env.API_KEY for the original execution environment.
    const apiKey = (window as any).GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please create a config.js file or set the API_KEY environment variable.");
    }
    ai = new GoogleGenAI({ apiKey });
    return ai;
};


type PartialPost = Omit<Post, 'images'>;

const parsePostFromResponse = (responseText: string, appMode: 'lite' | 'pro'): PartialPost => {
    const titleMatch = responseText.match(/\[TITLE\]\s*([\s\S]*?)\s*\[SUBTITLE\]/);
    const subtitleMatch = responseText.match(/\[SUBTITLE\]\s*([\s\S]*?)\s*(\[METADESC\]|\[CONTENT\])/);
    
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Post';
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

    if (appMode === 'pro') {
        const metaDescMatch = responseText.match(/\[METADESC\]\s*([\s\S]*?)\s*\[KEYWORDS\]/);
        const keywordsMatch = responseText.match(/\[KEYWORDS\]\s*([\s\S]*?)\s*\[IMAGE_ALT_TEXTS\]/);
        const altTextsMatch = responseText.match(/\[IMAGE_ALT_TEXTS\]\s*([\s\S]*?)\s*\[CONTENT\]/);
        const contentMatch = responseText.match(/\[CONTENT\]\s*([\s\S]*)/);

        const content = contentMatch ? contentMatch[1].trim() : '';
        const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
        const seoKeywords = keywordsMatch ? keywordsMatch[1].trim().split(',').map(k => k.trim()).filter(Boolean) : [];
        const imageAltTexts = altTextsMatch ? altTextsMatch[1].trim().split('\n').map(alt => alt.trim()).filter(Boolean) : [];

        if (!title || !subtitle || !content) {
            console.error("Failed to parse PRO response:", responseText);
            throw new Error("Failed to parse the response from the AI. The structure was not as expected.");
        }
        return { title, subtitle, content, metaDescription, seoKeywords, imageAltTexts };

    } else { // lite mode
        const contentMatch = responseText.match(/\[CONTENT\]\s*([\s\S]*)/);
        const content = contentMatch ? contentMatch[1].trim() : '';
        if (!title || !subtitle || !content) {
            console.error("Failed to parse LITE response:", responseText);
            throw new Error("Failed to parse the response from the AI. The structure was not as expected.");
        }
        return { title, subtitle, content, metaDescription: '', seoKeywords: [], imageAltTexts: [] };
    }
};

const getLitePrompt = (languageName: string, userTitleContext: string) => `
Analyze this image and use Google Search to gather up-to-date information.
Based on the image and search results, generate a comprehensive, well-structured, and engaging blog post in ${languageName}.
The post should be approximately 1000 words.
${userTitleContext}
Generate the output in the following format, using the exact separators shown. Do not add any other text, explanations, or markdown formatting before or after this structure.

[TITLE]
A compelling and relevant title for the blog post, in ${languageName}.

[SUBTITLE]
An engaging subtitle that complements the title, in ${languageName}.

[CONTENT]
The full content of the blog post, approximately 1000 words, in ${languageName}.
`;

const getProPrompt = (languageName: string, userTitleContext: string) => `
Act as an expert content creator and SEO specialist. Analyze this image and use Google Search to gather up-to-date information.
Based on the image and search results, generate a highly detailed, comprehensive, SEO-optimized, and engaging blog post in ${languageName}.
The post must be well-structured with a clear hierarchy. It should be at least 1500 words long and include multiple H3 sections for main topics (e.g., "### Main Topic"). Within these sections, use bullet points, numbered lists, or bold text to improve readability and SEO.
${userTitleContext}
Generate the output in the following format, using the exact separators. Do not add any other text.

[TITLE]
A compelling, SEO-friendly title for the blog post, in ${languageName}.

[SUBTITLE]
An engaging subtitle that complements the title, in ${languageName}.

[METADESC]
A compelling meta description, between 120 and 155 characters.

[KEYWORDS]
A comma-separated list of 5-7 relevant SEO keywords.

[IMAGE_ALT_TEXTS]
Three distinct, descriptive, and keyword-rich alt texts for three images that would accompany this post. Each alt text should be on a new line.

[CONTENT]
The full blog post content, at least 1500 words, using H3 tags for subheadings, in ${languageName}.
`;


export async function generatePostFromImage(base64Data: string, mimeType: string, userTitle: string, language: 'en' | 'es', appMode: 'lite' | 'pro'): Promise<PartialPost> {
  try {
    const languageName = language === 'es' ? 'Spanish' : 'English';
    const userTitleContext = userTitle 
      ? `The user has provided a title to guide the theme: "${userTitle}". The generated title should be inspired by this.`
      : 'The user has not provided a title, so create one based on the image.';
    
    const prompt = appMode === 'pro'
        ? getProPrompt(languageName, userTitleContext)
        : getLitePrompt(languageName, userTitleContext);
    
    // FIX: Updated to use the modern `ai.models.generateContent` API.
    const response = await getAiClient().models.generateContent({
      // FIX: Updated model name to a recommended model.
      model: "gemini-2.5-pro",
      contents: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
      ],
      config: { tools: [{ googleSearch: {} }] },
    });

    // FIX: Updated response text extraction to use `response.text`.
    const postData = parsePostFromResponse(response.text, appMode);
        
    // FIX: Updated grounding metadata extraction to use the new response structure.
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        postData.sources = groundingChunks
            .filter(chunk => chunk.web && chunk.web.uri)
            .map(chunk => ({
                uri: chunk.web.uri,
                title: chunk.web.title || 'Untitled Source'
            }));
    }

    return postData;

  } catch (error) {
    console.error("Error generating post from Gemini:", error);
    if (error instanceof Error && error.message.includes("Failed to parse the response")) {
        throw error;
    }
    throw new Error("Failed to generate the blog post. Please check the console for more details.");
  }
}

export async function generatePostFromTopic(topic: string, language: 'en' | 'es', appMode: 'lite' | 'pro'): Promise<PartialPost> {
    try {
        const languageName = language === 'es' ? 'Spanish' : 'English';
        const litePrompt = `
Analyze this topic: "${topic}". Use Google Search to gather up-to-date information.
Based on the topic and search results, generate a comprehensive, well-structured, and engaging blog post in ${languageName}.
The post should be approximately 1000 words. The generated title should be inspired by the user's topic.
Generate the output in the following format, using the exact separators shown.

[TITLE]
A compelling title for the blog post based on the topic, in ${languageName}.

[SUBTITLE]
An engaging subtitle that complements the title, in ${languageName}.

[CONTENT]
The full content of the blog post, approximately 1000 words, in ${languageName}.
`;
        const proPrompt = `
Act as an expert content creator and SEO specialist. Analyze this topic: "${topic}". Use Google Search to gather up-to-date information.
Based on the topic and search results, generate a highly detailed, comprehensive, SEO-optimized, and engaging blog post in ${languageName}.
The post must be well-structured with a clear hierarchy. It should be at least 1500 words long and include multiple H3 sections for main topics (e.g., "### Main Topic"). Within these sections, use bullet points, numbered lists, or bold text to improve readability and SEO. The generated title should be inspired by the user's topic.
Generate the output in the following format, using the exact separators. Do not add any other text.

[TITLE]
A compelling, SEO-friendly title for the blog post based on the topic, in ${languageName}.

[SUBTITLE]
An engaging subtitle that complements the title, in ${languageName}.

[METADESC]
A compelling meta description, between 120 and 155 characters.

[KEYWORDS]
A comma-separated list of 5-7 relevant SEO keywords.

[IMAGE_ALT_TEXTS]
Three distinct, descriptive, and keyword-rich alt texts for three images that would accompany this post. Each alt text should be on a new line.

[CONTENT]
The full blog post content, at least 1500 words, using H3 tags for subheadings, in ${languageName}.
`;

        const finalPrompt = appMode === 'pro' ? proPrompt : litePrompt;

        // FIX: Updated to use the modern `ai.models.generateContent` API.
        const response = await getAiClient().models.generateContent({
            // FIX: Updated model name to a recommended model.
            model: "gemini-2.5-pro",
            contents: [{text: finalPrompt}],
            config: { tools: [{ googleSearch: {} }] },
        });

        // FIX: Updated response text extraction and grounding metadata parsing.
        const postData = parsePostFromResponse(response.text, appMode);

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            postData.sources = groundingChunks
                .filter(chunk => chunk.web && chunk.web.uri)
                .map(chunk => ({
                    uri: chunk.web.uri,
                    title: chunk.web.title || 'Untitled Source'
                }));
        }

        return postData;

    } catch (error) {
        console.error("Error generating post from topic with Gemini:", error);
        throw new Error("Failed to generate the blog post from the topic.");
    }
}

export async function generateTopicIdea(theme: string, language: 'en' | 'es'): Promise<string> {
    try {
        const languageName = language === 'es' ? 'Spanish' : 'English';
        const prompt = `Brainstorm a catchy and interesting blog post title in ${languageName} based on the following theme: "${theme}". Return only the title, with no extra text, explanations, or quotation marks.`;

        // FIX: Updated to use the modern `ai.models.generateContent` API.
        const response = await getAiClient().models.generateContent({
            // FIX: Updated model name to a recommended model.
            model: 'gemini-2.5-flash',
            contents: [{text: prompt}],
        });

        // FIX: Updated response text extraction.
        return response.text.trim();
    } catch (error) {
        console.error("Error generating topic idea:", error);
        throw new Error("Failed to generate an idea.");
    }
}

export async function generateImagesForPost(
    postTitle: string,
    altTexts?: string[]
): Promise<string[]> {
    try {
        const finalStyle = 'photorealistic';
        const finalAspectRatio = '16:9';

        // Create a robust list of 3 image prompts.
        // Start with the alt texts provided by the text generation model.
        const imagePromptsArray: string[] = altTexts ? [...altTexts] : [];
        
        // If we have fewer than 3 prompts, add generic ones based on the post title to fill the gap.
        while (imagePromptsArray.length < 3) {
            imagePromptsArray.push(`An image that captures the essence of the blog post titled "${postTitle}"`);
        }
        
        // Ensure we only use 3 prompts and construct a clear instruction string for the image model.
        const finalPrompts = imagePromptsArray.slice(0, 3);
        const imageInstructions = `Image 1: "${finalPrompts[0]}". Image 2: "${finalPrompts[1]}". Image 3: "${finalPrompts[2]}".`;
        
        const prompt = `Generate three distinct, ${finalStyle}, high-quality images for a blog post titled "${postTitle}". The images should be based on the following descriptions: ${imageInstructions}`;
        
        const response = await getAiClient().models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 3,
              outputMimeType: 'image/jpeg',
              aspectRatio: finalAspectRatio,
            },
        });

        return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
    } catch (error) {
        console.error("Error generating images from Gemini:", error);
        throw new Error("Failed to generate images for the blog post.");
    }
}