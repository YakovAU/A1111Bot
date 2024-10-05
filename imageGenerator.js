const axios = require('axios');
const config = require('./config');

async function generateImage(prompt) {
    const payload = {
        prompt: prompt,
        negative_prompt: "deformed, unrealistic",
        steps: 35,
        cfg_scale: 3,
        width: 1024,
        height: 1024,
        sampler_name: "DPM++ 2M SDE",
        override_settings: {
            sd_model_checkpoint: "juggernautXL_juggXIByRundiffusion.safetensors"
        },
        override_settings_restore_afterwards: true
    };

    const response = await axios.post(`${config.automatic1111Url}/sdapi/v1/txt2img`, payload);

    if (!response.data || !response.data.images || response.data.images.length === 0) {
        throw new Error('No images were generated.');
    }

    const image = response.data.images[0];
    return Buffer.from(image, 'base64');
}

module.exports = { generateImage };
