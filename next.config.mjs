/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    webpack: (config) => {
        config.module.rules.push({
            test: /\w+\.glsl$/i,
            type: 'asset/source'
        }, {
            test: /\w+\.fb$/i,
            type: 'asset/source'
        }, {
            test: /\w+\.obj$/i,
            type: 'asset/source'
        });
        return config;
    },
};

export default nextConfig;
