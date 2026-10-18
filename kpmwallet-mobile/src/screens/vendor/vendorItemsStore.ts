export type VendorItem = {
  id: string;
  name: string;
  detail: string;
  price: number;
  stock: number;
  category: 'Food & Drink' | 'Snacks' | 'Stationery';
  icon: string;
  tint: string;
  background: string;
};

let inventory: VendorItem[] = [];

export function getVendorItems() {
  return inventory.map((item) => ({ ...item }));
}

export function setVendorItems(items: VendorItem[]) {
  inventory = items.map((item) => ({ ...item }));
}

let clearCartForNextCustomer = false;

export function requestNewCustomer() {
  clearCartForNextCustomer = true;
}

export function consumeNewCustomerRequest() {
  const shouldClear = clearCartForNextCustomer;
  clearCartForNextCustomer = false;
  return shouldClear;
}
