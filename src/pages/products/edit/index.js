import ProductForm from "../../../components/product-form";

export default class Page {
  element;
  subElements = {};
  components = {};

  constructor () {
    const url = decodeURI(window.location.pathname).replace(/^\/|\/$/, '');

    this.productId = url.match(/products\/(.+)$/)[1];
  }

  async render() {
    const element = document.createElement('div');

    element.innerHTML = `
    <div class="products-edit">
      <div class="content__top-panel">
        <h1 class="page-title">
          <a href="/products" class="link">Товары</a> / ${this.productId === 'add' ? 'Добавить' : 'Редактировать'}
        </h1>
      </div>
      <div class="content-box"></div>
    </div>`;

    this.element = element.firstElementChild;

    this.initComponents();
    await this.renderComponents();

    return this.element;
  }

  initComponents() {
    this.components.productForm = this.productId === 'add' ? new ProductForm() : new ProductForm(this.productId);
  }

  async renderComponents() {
    const element = await this.components.productForm.render();

    this.element.lastElementChild.append(element);
  }

  destroy() {
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
