const fs = require('fs');
const https = require('https');
const path = require('path');

const icons = {
    'input': 'settings-input-component',
    'monitor': 'monitor-heart-outline',
    'effects': 'magic-button-outline',
    'settings': 'settings-outline',
    'extension': 'extension',
    'pins': 'developer-board',
    'buttons': 'radio-button-checked-outline',
    'license': 'verified-user-outline'
};

const dir = path.join(__dirname, 'apps/configurator/src/assets/icons');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

Object.entries(icons).forEach(([name, iconifyName]) => {
    const url = 'https://api.iconify.design/material-symbols:' + iconifyName + '.svg?color=white';
    console.log(`Downloading ${url}...`);
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            // Replace fill='white' or whatever color with fill='currentColor'
            const svg = data.replace(/fill=\"[^\"]*\"/g, 'fill="currentColor"');
            fs.writeFileSync(path.join(dir, name + '.svg'), svg);
            console.log(`Saved ${name}.svg`);
        });
    }).on('error', (err) => {
        console.error(`Error downloading ${name}: ${err.message}`);
    });
});
