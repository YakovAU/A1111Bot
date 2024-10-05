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

async function generateImage(prompt, model) {
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
        const response = await axios.post(`${config.automatic1111Url}/sdapi/v1/txt2img`, payload);

        if (!response.data || !response.data.images || response.data.images.length === 0) {
            throw new Error('No images were generated.');
        }

        const image = response.data.images[0];
        return Buffer.from(image, 'base64');
    } catch (error) {
        console.error('Error generating image:', error);
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
