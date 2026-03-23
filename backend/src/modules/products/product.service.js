let products = [];

const createProduct = (data) => {
  const newProduct = {
    id: products.length + 1,
    ...data
  };

  products.push(newProduct);
  return newProduct;
};


const getAllProducts = () => {
  return products;
};

export default {
  createProduct,
  getAllProducts
};