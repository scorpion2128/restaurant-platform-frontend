import './GroupedOrderItems.css';

const normalizeSectionName = (sectionName = '') => sectionName
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toUpperCase();

const getSectionLabel = (sectionName) => ({
  ENTRADA: 'Entradas',
  ENTRADAS: 'Entradas',
  SOPA: 'Sopas',
  SOPAS: 'Sopas',
  'PLATO DE FONDO': 'Platos de fondo',
  'PLATOS DE FONDO': 'Platos de fondo',
  BEBIDA: 'Bebidas',
  BEBIDAS: 'Bebidas'
}[normalizeSectionName(sectionName)] || sectionName || 'Otros');

const getMenuPartLabel = (sectionName) => {
  const normalized = normalizeSectionName(sectionName);
  if (normalized.includes('ENTRADA') || normalized.includes('SOPA')) return 'Entrada';
  if (normalized.includes('FONDO')) return 'Fondo';
  if (normalized.includes('BEBIDA')) return 'Bebida';
  return sectionName || 'Producto';
};

const groupOrderItems = (items = []) => {
  const menuGroups = new Map();
  const sectionGroups = new Map();

  items.forEach((item) => {
    if (item.isPartOfMenu && item.menuGroupId != null) {
      if (!menuGroups.has(item.menuGroupId)) menuGroups.set(item.menuGroupId, []);
      menuGroups.get(item.menuGroupId).push(item);
      return;
    }

    const sectionLabel = getSectionLabel(item.sectionName || 'Otros');
    if (!sectionGroups.has(sectionLabel)) sectionGroups.set(sectionLabel, []);
    sectionGroups.get(sectionLabel).push(item);
  });

  const groups = [];
  if (menuGroups.size > 0) {
    groups.push({ type: 'menus', label: 'Menús', entries: [...menuGroups.values()] });
  }
  sectionGroups.forEach((entries, sectionLabel) => {
    groups.push({ type: 'section', label: sectionLabel, entries });
  });
  return groups;
};

export const countOrderSelections = (items = []) => {
  const menuGroupIds = new Set();
  let individualItems = 0;

  items.forEach((item) => {
    if (item.isPartOfMenu && item.menuGroupId != null) menuGroupIds.add(item.menuGroupId);
    else individualItems += 1;
  });

  return menuGroupIds.size + individualItems;
};

const GroupedOrderItems = ({ items = [], compact = false, maxGroups }) => {
  const groups = groupOrderItems(items);
  const visibleGroups = maxGroups ? groups.slice(0, maxGroups) : groups;
  const hiddenGroups = groups.length - visibleGroups.length;

  return (
    <div className={`grouped-order-items${compact ? ' compact' : ''}`}>
      {visibleGroups.map((group) => (
        <section className="grouped-order-section" key={`${group.type}-${group.label}`}>
          <h5>{group.label}</h5>
          {group.type === 'menus' ? group.entries.map((menuItems) => (
            <div className="grouped-menu-entry" key={menuItems[0].menuGroupId}>
              <span className="grouped-item-quantity">{menuItems[0].quantity || 1}</span>
              <div className="grouped-menu-parts">
                {menuItems.map((item) => (
                  <div className="grouped-menu-part" key={item.id || `${item.menuGroupId}-${item.productId}`}>
                    <small>{getMenuPartLabel(item.sectionName)}</small>
                    <span>{item.productName || item.menuItemName || 'Producto'}</span>
                  </div>
                ))}
              </div>
            </div>
          )) : group.entries.map((item, index) => (
            <div className="grouped-product-entry" key={item.id || `${group.label}-${index}`}>
              <span className="grouped-item-quantity">{item.quantity || 1}</span>
              <span>{item.productName || item.menuItemName || 'Producto'}</span>
            </div>
          ))}
        </section>
      ))}
      {hiddenGroups > 0 && <span className="grouped-order-more">+{hiddenGroups} secciones más</span>}
    </div>
  );
};

export default GroupedOrderItems;
