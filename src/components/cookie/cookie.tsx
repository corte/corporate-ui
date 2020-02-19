import {
  Component, h, Prop, State, Element, Watch
} from '@stencil/core';

import JsCookie from 'js-cookie';
import Tab from 'bootstrap/js/src/tab';

@Component({
  tag: 'c-cookie',
  styleUrl: 'cookie.scss',
  shadow: true,
})
export class Cookie {
  @Prop({ context: 'store' }) ContextStore: any;

  /** Per default, this will inherit the value from c-theme name property */
  @Prop({ mutable: true }) theme: string;

  @Prop() open: boolean;

  @Prop() headline = 'Confidentiality agreement';

  @Prop() modalButtonPrimary = 'Save preferences';

  @Prop() modalButtonSecondary = 'Cancel';

  @Prop() mainButtonPrimary = 'Accept';

  @Prop() mainButtonSecondary = 'Cookie settings';

  @Prop() inline: boolean;

  @State() store: any;

  @State() tagName: string;

  @State() currentTheme = { components: [] };

  @State() style: Array<CSSStyleSheet>;

  @State() items: Array<any> = [];

  @State() tab;

  @State() all = false;

  @State() text;

  @State() modal;

  @State() active;

  @State() cookie = JsCookie.get('ConfidentialityAgreement');

  @State() modalConfig:any = { backdrop: 'static' };

  @Element() el;

  @Watch('theme')
  setTheme(name = undefined) {
    this.theme = name || this.store.getState().theme.current;
    this.currentTheme = this.store.getState().theme.items[this.theme];
  }

  @Watch('inline')
  configureBackdrop(inline) {
    // this.modalConfig.backdrop = inline ? 'static' : !inline;
    this.modalConfig = { ...this.modalConfig, backdrop: inline ? !inline : 'static' };
  }

  @Watch('tab')
  initTabs(el) {
    // TODO: Maybe we can solve this in a better way later
    if(this.el.parentNode.nodeName !== 'C-CODE-SAMPLE') {
      const tab = new Tab(el);

      // We use a timeout here to make sure the dynamic tab-content have time to get added
      setTimeout(() => {
        const target = (this.el.shadowRoot || this.el).querySelector(el.getAttribute('href'));

        el.onclick = (event) => {
          event.preventDefault();
          tab.show();

          // Due to bs methods having document hardcoded we need to do this
          tab._activate(target, target.parentNode, () => {});
        }
      });
    }
  }

  async loadLibs() {
    const jsCookie = await import('js-cookie');
    window['CorporateUi'].Cookie = jsCookie.default;
  }

  save(event) {
    event.preventDefault();

    let object = {};

    if(this.all) {
      this.items.forEach(item => item.attributes.checked = true);
    }

    this.items.filter(item => item.toggable).forEach(item =>
      object[item.type || item.id] = item.attributes.checked
    );

    const content = JSON.stringify(object);

    setTimeout(() => {
      this.open = false;
      this.cookie = content;
    }, 200);

    JsCookie.set('ConfidentialityAgreement', content, { sameSite: 'lax' });

    const customEvent = new CustomEvent('cookieSaved', { detail: { cookie: object }, bubbles: true });
    this.el.dispatchEvent(customEvent);
  }

  check(item, index) {
    // TODO: Maybe we can improve this later on
    const items = [ ...this.items ];
    item.attributes.checked = !item.attributes.checked;
    items.splice(index, 1);
    items.splice(index, 0, item);
    this.items = items;
  }

  themeStyle() {
    const css = this.currentTheme ? this.currentTheme.components[this.tagName] : '';
    let style;

    if(!this.style) return;

    // This is used by browsers with support for shadowdom
    if(this.el.shadowRoot.adoptedStyleSheets) {
      style = new CSSStyleSheet();
      style.replaceSync(css);
      // TODO: We should not take first index we should all except the previous style
      this.el.shadowRoot.adoptedStyleSheets = [ this.el.shadowRoot.adoptedStyleSheets[0], style ];
    } else {
      const node = this.el.shadowRoot || this.el;
      style = this.el.querySelector('#themeStyle') || document.createElement('style');
      // style.appendChild(document.createTextNode(css));
      // style.innerHTML = css;
      style.id = 'themeStyle';

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }

      if(!node.querySelector('#themeStyle')) {
        node.insertBefore(style, node.firstChild.nextSibling);
      }
    }
  }

  componentWillLoad() {
    this.loadLibs();

    this.store = this.ContextStore || (window as any).CorporateUi.store;

    this.setTheme(this.theme);

    this.configureBackdrop(this.inline);

    this.store.subscribe(() => {
      this.setTheme();
      this.themeStyle();
    });

    if (!(this.el && this.el.nodeName)) return;

    this.tagName = this.el.nodeName.toLowerCase();
  }

  componentDidLoad() {
    // TODO: Maybe we can solve this in a better way later
    if(this.el.parentNode.nodeName === 'C-CODE-SAMPLE') return;

    this.style = this.el.shadowRoot.adoptedStyleSheets || [];

    this.themeStyle();

    // TODO: It would make sense to create a tab and tab-item component.
    // That can be used instead of this hacky way
    let items = this.el.shadowRoot.querySelectorAll('[slot="config"]');

    // This is used by browsers with support for shadowdom
    if(document.head.attachShadow) {
      const slotted = this.el.shadowRoot.querySelector('slot[name="config"]');
      items = slotted.assignedNodes().filter((node:any) => { return node.nodeName !== '#text'; })
    }

    this.cookie = JsCookie.get('ConfidentialityAgreement');
    const cookieObj = this.cookie ? JSON.parse(this.cookie) : {};

    this.items = Array.from(items).map((item:any) => {
      const id = item.getAttribute('text').match(/[a-z]+/gi)
        .map(word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()).join('');

      return {
        id,
        content: item.outerHTML,
        type: item.getAttribute('type'),
        intro: item.getAttribute('intro'),
        text: item.getAttribute('text'),
        toggable: item.getAttribute('toggable') !== 'false',
        attributes: {
          disabled: item.getAttribute('mandatory') === 'true',
          checked: cookieObj[item.getAttribute('type')] === true ||
                    cookieObj[id] === true ||
                    item.getAttribute('checked') === 'true'
        }
      }
    });
  }

  render() {
    return [
      <form onSubmit={event => this.save(event)} onReset={(event) => { event.preventDefault(); this.open = false }}>
        <slot name="config" />

        <c-modal open={this.open} config={this.modalConfig} close={false} class={this.inline ? 'inline' : ''}>
          <h2 slot="header">{this.headline}</h2>

          <main>
            <div class={"row h-100 flex-sm-fill" + (this.active ? ' active': '')}>
              <div class="col-6 col-lg-3 h-100 navigation">
                {this.items.length && this.items[0].intro ?
                  <div class="d-lg-none mb-5 pl-4 pr-4">
                    <h3>{this.items[0].text}</h3>
                    <article innerHTML={this.items[0].intro} />
                  </div>
                : ''}

                <nav class="list-group" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                  {this.items.map((item, index) => (
                    <a href={'#v-pills-' + index} class={'list-group-item list-group-item-action' + (index === 0 ? ' d-none d-lg-block active' : '')} data-toggle="pill" ref={el => this.tab = el} onClick={() => this.active = true}>
                      {item.text}

                      {item.toggable ?
                        item.attributes.disabled ?
                          <input type="checkbox" name={item.type || item.id} checked={this.items[index].attributes.checked} value="true" hidden />
                        :
                          <div class="custom-control custom-switch" onClick={event => event.stopPropagation()}>
                            <input type="checkbox" name={item.type || item.id} id={item.type || item.id} value="true" class="custom-control-input" onChange={() => this.check(item, index)} { ... { ...item.attributes } } />
                            <label class="custom-control-label" { ... { for: item.type || item.id } }></label>
                          </div>
                      : ''}

                    </a>
                  ))}

                  <slot name="link" />
                </nav>
              </div>
              <div class="col-6 col-lg-9 content">
                <div class="tab-content">
                  <a href="" class="btn btn-link btn-block d-lg-none btn-back" onClick={(event) => { event.preventDefault(); this.active = false }}>&lt; Cookie policy</a>

                  {this.items.map((item, index) => (
                    <div class={'tab-pane fade' + (index === 0 ? ' show active' : '')} id={'v-pills-' + index} role="tabpanel" aria-labelledby={'v-pills-' + index + '-tab'}>
                      <h3>{item.text}</h3>
                      <article innerHTML={item.content} />

                      {!item.attributes.disabled ?
                        <div class="custom-control custom-switch d-lg-none" onClick={event => event.stopPropagation()}>
                          <input type="checkbox" name={item.type || item.id} id={item.type || item.id} value="true" class="custom-control-input" onInput={() => this.check(item, index)} { ... { ...item.attributes } } />
                          <label class="custom-control-label" { ... { for: item.type || item.id } }></label>
                        </div>
                      : <span class="badge badge-pill badge-primary">{item.attributes.checked ? 'Active' : ''}</span> }

                      {/* {item.toggable ?
                        <div class="custom-control custom-switch pt-4 pb-4">
                          <input type="checkbox" class="custom-control-input" { ... { ...item.attributes } } />
                          <label class="custom-control-label" onClick={() => {this.items[index].attributes.checked = false; console.log(this.items[index])}}></label>
                        </div>
                      : ''} */}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          <button type="reset" class="btn btn-secondary" slot="footer">{this.modalButtonSecondary}</button>
          <button type="submit" class="btn btn-primary" slot="footer">{this.modalButtonPrimary}</button>
        </c-modal>
      </form>,

      !this.cookie ?
        <footer class={this.inline ? 'inline' : ''}>
          <div class="container">
            <div class="row">
              <div class="col main">
                <slot name="main" />
              </div>
              <div class="col-sm-12 col-lg-auto mt-4 mb-4 btn-container">
                <div class="row">
                  <div class="col col-lg-auto">
                    <button class="btn btn-block btn-outline-light" onClick={() => this.open = true}>{this.mainButtonSecondary}</button>
                  </div>
                  <div class="col col-lg-auto">
                    <button class="btn btn-block btn-outline-light" onClick={event => { this.all = true; this.save(event) }}>{this.mainButtonPrimary}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      :
        <div class="d-none">
          <slot name="main" />
        </div>
    ]
  }
}