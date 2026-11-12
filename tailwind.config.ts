import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { ink: '#1c211d', moss: '#65725d', paper: '#f4f2ec', clay: '#c96e4c' }, fontFamily: { sans: ['Arial', 'sans-serif'], display: ['Georgia', 'serif'] } } }, plugins: [] };
export default config;
