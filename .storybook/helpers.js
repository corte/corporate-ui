
export function renderMain(page) {
  return `
    <main>
      <header>
        <h4>${page.title}</h4>
      </header>

      ${page.content}
    </main>
  `
}

export function renderOverview(page) {
  return renderMain({
    ...page,
    content: `
      <section class="overview">
        ${page.description ? `<p>${page.description}</p>` : ''}

        ${page.items.map(name => `
          <c-card
            data-sb-kind="${page.kind}"
            data-sb-story="${name.title}">
            <${name.name} slot="card-body" class="component"></${name.name}>
            <strong slot="card-footer">${name.title}</strong>
          </c-card>
        `).join('')}
      </section>
    `
  })
}

export function renderItem(page) {
  return renderMain({
    ...page,
    content: `
      <section class="template">
        <h4>${page.title}</h4>
        ${ page.description ? `<p>${page.description}</p>` : '' }

        ${page.content}
      </section>
    `
  })
}

export function renderItems(page) {
  return renderMain({
    ...page,
    content: page.items.map(item => `
      <section class="component">
        <h4>${item.title}</h4>
        <div>
          <figure>${item.content}</figure>

          <details>
            <summary>Toggle code example</summary>
            <c-code-sample>${item.content}</c-code-sample>
          </details>
        </div>
      </section>
    `).join('')
  })
}
