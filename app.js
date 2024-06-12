const SHOPIFY_API_URL = 'https://anatta-test-store.myshopify.com/admin/api/2023-04/graphql.json'
const ACCESS_TOKEN = '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'

async function callShopifyGraphql(query, variables = {}) {
    const response = await fetch(SHOPIFY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': ACCESS_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
    })

    const responseBody = await response.json();

    if (response.ok) {
        return responseBody.data;
    } else {
        throw new Error(`Shopify GraphQL API error: ${responseBody.errors.map(e => e.message).join(', ')}`)
    }
}

async function fetchProductsByName(productName) {
    const query = `
        query($productName: String!) {
            products(first: 100, query: $productName) {
                edges {
                    node {
                        title
                        variants(first: 10) {
                            edges {
                                node {
                                    title
                                    price
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    const variables = {
        productName
    };

    const data = await callShopifyGraphql(query, variables);

    return data.products.edges.map(edge => ({
        title: edge.node.title,
        variants: edge.node.variants.edges.map(variantEdge => ({
            title: variantEdge.node.title,
            price: parseFloat(variantEdge.node.price)
        })).sort((a, b) => a.price - b.price)
    }));
}

async function main() {
    const arguments = process.argv
    if (arguments.length < 4 || arguments[2] != '-name') {
        throw new Error("Invalid Arguments, please run with -name :name")
    }
    
    const productName = arguments[3]

    const products = await fetchProductsByName(productName)
    products.forEach(product => {
        product.variants.forEach(variant => {
            console.log(`${product.title} - variant ${variant.title} - price $${variant.price.toFixed(2)}`);
        });
    });
}

main().catch(console.error)