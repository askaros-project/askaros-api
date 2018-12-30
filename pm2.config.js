module.exports = {
	apps: [
		{
			name: "qapp-server",
			script: "./dist/index.js",
			watch: false,
			env_stage: {
				NODE_ENV: "production",
				PORT: 5000
			},
			env_production: {
				NODE_ENV: "production",
				PORT: 5000
			}
		}
	]
}
