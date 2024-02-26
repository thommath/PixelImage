import markdownRawPlugin from 'vite-raw-plugin';

export default {
    plugins: [
        markdownRawPlugin({
            fileRegex: /\.(frag|vert)$/
        })
    ],
    define: {
        __isBrowser__: true
    },
    resolve: {
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    }
}