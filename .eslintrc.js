module.exports = {
    extends: [
        'plugin:vue/vue3-recommended',
        'prettier',
        'prettier/vue'
    ],
    plugins: ['vue', 'prettier'],
    rules: {
        'prettier/prettier': 'error'
    }
};