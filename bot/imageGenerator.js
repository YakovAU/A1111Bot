const axios = require('axios');
const config = require('../config');

async function getModels() {
    try {
        const response = await axios.get(`${config.automatic1111Url}/sdapi/v1/sd-models`);
        return response.data.map(model => ({
            title: model.title,
            model_name: model.model_name,
            hash: model.hash,
            sha256: model.sha256,
            filename: model.filename,
            config: model.config
        }));
    } catch (error) {
        console.error('Error fetching models:', error);
        throw error;
    }
}

async function generateImage(prompt, model, retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    const payload = {
        prompt: prompt,
        negative_prompt: "deformed, unrealistic",
        steps: 35,
        cfg_scale: 3,
        width: 1024,
        height: 1024,
        sampler_name: "DPM++ 2M SDE",
        override_settings: {
            sd_model_checkpoint: model
        },
        override_settings_restore_afterwards: true
    };

    try {
        // Try to reload model first
        await axios.post(`${config.automatic1111Url}/sdapi/v1/reload-checkpoint`, {
            model_name: model
        }).catch(err => console.warn('Model reload attempt failed:', err.message));

        const response = await axios.post(`${config.automatic1111Url}/sdapi/v1/txt2img`, payload);

        if (!response.data || !response.data.images || response.data.images.length === 0) {
            throw new Error('No images were generated.');
        }

        const image = response.data.images[0];
        return Buffer.from(image, 'base64');
    } catch (error) {
        console.error('Error generating image:', error);
        
        // Check if error is related to SafetensorError or model loading
        if ((error.response?.data?.error === 'SafetensorError' || 
             error.message.includes('SafetensorError') ||
             error.message.includes('MetadataIncompleteBuffer')) && 
            retryCount < MAX_RETRIES) {
            
            console.log(`Retrying image generation (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return generateImage(prompt, model, retryCount + 1);
        }

        throw error;
    }
}

async function getProgress() {
    try {
        const response = await axios.get(`${config.automatic1111Url}/sdapi/v1/progress`);
        return response.data;
    } catch (error) {
        console.error('Error fetching progress:', error);
        throw error;
    }
}

module.exports = { generateImage, getModels, getProgress };
