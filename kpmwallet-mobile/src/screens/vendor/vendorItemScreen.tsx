import React, { useCallback, useMemo, useState } from 'react';
import { LocalizedText as Text } from '../../components/LocalizedText';
import {
  ScrollView,
  StyleSheet,


  View,
  Pressable,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { LocalizedTextInput as TextInput } from '../../components/LocalizedTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { consumeNewCustomerRequest, getVendorItems, setVendorItems, type VendorItem } from './vendorItemsStore';
import api from '../../services/api';

type Category = 'Food & Drink' | 'Snacks' | 'Stationery';

const categories: Array<'All' | Category> = [
  'All',
  'Food & Drink',
  'Snacks',
  'Stationery',
];

const formatPrice = (price: number) => `RM ${price.toFixed(2)}`;

function mapItemFromApi(raw: any): VendorItem {
  const visualByCategory: Record<Category, Pick<VendorItem, 'icon' | 'tint' | 'background'>> = {
    'Food & Drink': { icon: 'fast-food-outline', tint: '#E68132', background: '#FFF1E5' },
    Snacks: { icon: 'gift-outline', tint: '#D59B20', background: '#FFF7DF' },
    Stationery: { icon: 'book-outline', tint: '#7663C8', background: '#F0EDFF' },
  };
  const category = raw.category as Category;
  const visual = visualByCategory[category] ?? visualByCategory['Food & Drink'];
  const name = String(raw.name ?? '');
  const icon = name.toLowerCase().includes('water')
    ? 'water-outline'
    : name.toLowerCase().includes('milo')
      ? 'cafe-outline'
      : name.toLowerCase().includes('pen')
        ? 'pencil-outline'
        : visual.icon;

  return {
    id: String(raw.item_id),
    name,
    detail: raw.description || category,
    price: Number(raw.price),
    stock: Number(raw.stock),
    category,
    ...visual,
    icon,
  };
}

export default function VendorItemScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('All');
  const [query, setQuery] = useState('');
  const [itemList, setItemList] = useState<VendorItem[]>(getVendorItems);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartVisible, setCartVisible] = useState(false);

  useFocusEffect(useCallback(() => {
    if (consumeNewCustomerRequest()) setCart({});
    setItemList(getVendorItems());

    let isActive = true;
    const loadItems = async () => {
      try {
        const response = await api.get('/items');
        const nextItems = (response.data as any[]).map(mapItemFromApi);
        setVendorItems(nextItems);
        if (isActive) setItemList(nextItems);
      } catch (error) {
        console.log('Failed to load items:', error);
      }
    };
    loadItems();

    return () => { isActive = false; };
  }, []));

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return itemList.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = !normalizedQuery ||
        `${item.name} ${item.detail} ${item.category}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, itemList, query]);

  const visibleCategories = activeCategory === 'All'
    ? categories.slice(1)
    : [activeCategory];
  const cartItems = itemList.filter((item) => (cart[item.id] ?? 0) > 0);
  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * cart[item.id], 0);

  const updateCart = (itemId: string, change: number) => {
    setCart((current) => {
      const selectedItem = itemList.find((item) => item.id === itemId);
      if (change > 0 && selectedItem && (current[itemId] ?? 0) >= selectedItem.stock) return current;
      const nextQuantity = (current[itemId] ?? 0) + change;
      const next = { ...current };
      if (nextQuantity <= 0) delete next[itemId];
      else next[itemId] = nextQuantity;
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingHorizontal: Math.min(width * 0.055, 24) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topLine}>
          <View>
            <Text style={styles.title}>Items</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`View cart, ${cartCount} items`} onPress={() => setCartVisible(true)} style={styles.addButton}>
            <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Browse and manage your products</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#8290A5" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search items"
            placeholderTextColor="#9AA6B7"
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={19} color="#9AA6B7" />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((category) => {
            const selected = activeCategory === category;
            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setActiveCategory(category)}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
              >
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{category}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>{activeCategory === 'All' ? 'All products' : activeCategory}</Text>
          <Text style={styles.itemCount}>{filteredItems.length} items</Text>
        </View>

        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name="search-outline" size={24} color="#8290A5" /></View>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyText}>Try another name or category.</Text>
          </View>
        ) : (
          visibleCategories.map((category) => {
            const categoryItems = filteredItems.filter((item) => item.category === category);
            if (categoryItems.length === 0) return null;
            return (
              <View key={category} style={styles.group}>
                {activeCategory === 'All' && (
                  <View style={styles.groupHeading}>
                    <Text style={styles.groupTitle}>{category}</Text>
                  </View>
                )}
                {categoryItems.map((item, index) => (
                  <Pressable key={item.id} style={[styles.itemCard, index > 0 && styles.itemCardSpacing]}>
                    <View style={[styles.itemIcon, { backgroundColor: item.background }]}>
                        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.tint} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemDetail} numberOfLines={1}>{item.detail}</Text>
                      <View style={styles.stockLine}>
                        <View style={[styles.stockDot, item.stock <= 5 && styles.lowStockDot]} />
                        <Text style={[styles.stockText, item.stock <= 5 && styles.lowStockText]}>
                          {item.stock <= 5 ? 'Low stock' : 'In stock'} · {item.stock}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${item.name} to cart`}
                        disabled={(cart[item.id] ?? 0) >= item.stock}
                        onPress={() => updateCart(item.id, 1)}
                        style={[styles.addToCartButton, (cart[item.id] ?? 0) >= item.stock && styles.addToCartButtonDisabled]}
                      >
                        <Ionicons name="add" size={19} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </View>
            );
          })
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal visible={cartVisible} animationType="slide" transparent onRequestClose={() => setCartVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCartVisible(false)} accessibilityLabel="Close cart" />
          <View style={styles.cartSheet}>
            <View style={styles.cartHandle} />
            <View style={styles.cartHeader}>
              <View>
                <Text style={styles.cartTitle}>Your cart</Text>
                <Text style={styles.cartSubtitle}>{cartCount} {cartCount === 1 ? 'item' : 'items'}</Text>
              </View>
              <Pressable onPress={() => setCartVisible(false)} style={styles.closeCartButton} accessibilityRole="button" accessibilityLabel="Close cart">
                <Ionicons name="close" size={22} color="#52627A" />
              </Pressable>
            </View>

            {cartItems.length === 0 ? (
              <View style={styles.cartEmpty}>
                <View style={styles.cartEmptyIcon}><Ionicons name="cart-outline" size={26} color="#8290A5" /></View>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptyText}>Add items to see them here.</Text>
              </View>
            ) : (
              <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
                {cartItems.map((item) => (
                  <View key={item.id} style={styles.cartItemRow}>
                    <View style={[styles.itemIcon, styles.cartItemIcon, { backgroundColor: item.background }]}>
                      <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={item.tint} />
                    </View>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemDetail}>{formatPrice(item.price)} each</Text>
                    </View>
                    <View style={styles.quantityControl}>
                      <Pressable onPress={() => updateCart(item.id, -1)} style={styles.quantityButton} accessibilityRole="button" accessibilityLabel={`Remove one ${item.name}`}>
                        <Ionicons name="remove" size={16} color="#1769E0" />
                      </Pressable>
                      <Text style={styles.quantityText}>{cart[item.id]}</Text>
                      <Pressable onPress={() => updateCart(item.id, 1)} disabled={cart[item.id] >= item.stock} style={[styles.quantityButton, cart[item.id] >= item.stock && styles.quantityButtonDisabled]} accessibilityRole="button" accessibilityLabel={`Add one ${item.name}`}>
                        <Ionicons name="add" size={16} color="#1769E0" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.cartFooter}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalPrice}>{formatPrice(cartTotal)}</Text>
              </View>
              <Pressable
                style={[styles.checkoutButton, cartCount === 0 && styles.checkoutButtonDisabled]}
                disabled={cartCount === 0}
                onPress={() => {
                  setCartVisible(false);
                  navigation.navigate('Checkout', {
                    cartItems: cartItems.map((item) => ({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      quantity: cart[item.id],
                    })),
                  });
                }}
              >
                <Text style={styles.checkoutText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingTop: 18, paddingBottom: 20 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#152746', fontSize: 30, fontWeight: '800', letterSpacing: -0.7 },
  addButton: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#1769E0', alignItems: 'center', justifyContent: 'center', shadowColor: '#1769E0', shadowOpacity: 0.2, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  cartBadge: { position: 'absolute', top: -5, right: -5, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, backgroundColor: '#F15B5D', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F6F8FC' },
  cartBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  subtitle: { marginTop: 3, color: '#78879B', fontSize: 14 },
  searchBox: { height: 52, marginTop: 22, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EDF4', borderRadius: 16 },
  searchInput: { flex: 1, marginLeft: 10, paddingVertical: 0, color: '#1D2D48', fontSize: 15 },
  categoryRow: { paddingTop: 18, paddingBottom: 4, gap: 9 },
  categoryChip: { minHeight: 38, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF3', alignItems: 'center', justifyContent: 'center' },
  categoryChipSelected: { backgroundColor: '#1769E0', borderColor: '#1769E0' },
  categoryText: { color: '#66758B', fontSize: 13, fontWeight: '600' },
  categoryTextSelected: { color: '#FFFFFF' },
  listHeading: { marginTop: 24, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#1B2C48', fontSize: 18, fontWeight: '700' },
  itemCount: { color: '#8491A4', fontSize: 12, fontWeight: '600' },
  group: { marginTop: 15 },
  groupHeading: { marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupTitle: { color: '#61718A', fontSize: 13, fontWeight: '700' },
  itemCard: { minHeight: 91, padding: 13, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: '#EDF0F5' },
  itemCardSpacing: { marginTop: 9 },
  itemIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, marginLeft: 12, minWidth: 0 },
  itemName: { color: '#1D2D48', fontSize: 14, fontWeight: '700' },
  itemDetail: { marginTop: 3, color: '#8995A6', fontSize: 11 },
  stockLine: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  stockDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#35B779' },
  lowStockDot: { backgroundColor: '#EAA13B' },
  stockText: { color: '#74839A', fontSize: 10, fontWeight: '500' },
  lowStockText: { color: '#C78322' },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 2, marginLeft: 8 },
  itemPrice: { color: '#1D2D48', fontSize: 13, fontWeight: '700' },
  addToCartButton: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#1769E0', alignItems: 'center', justifyContent: 'center' },
  addToCartButtonDisabled: { backgroundColor: '#AEBBD0' },
  emptyState: { alignItems: 'center', paddingTop: 55, paddingBottom: 30 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#E9EEF6', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 13, color: '#263852', fontSize: 15, fontWeight: '700' },
  emptyText: { marginTop: 5, color: '#8793A5', fontSize: 13 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(14, 27, 48, 0.42)' },
  cartSheet: { maxHeight: '82%', minHeight: 390, paddingTop: 10, paddingHorizontal: 22, paddingBottom: 22, backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  cartHandle: { width: 40, height: 4, marginBottom: 18, alignSelf: 'center', borderRadius: 2, backgroundColor: '#D8DEE8' },
  cartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#EDF0F5' },
  cartTitle: { color: '#1B2C48', fontSize: 22, fontWeight: '800' },
  cartSubtitle: { marginTop: 3, color: '#8491A4', fontSize: 12 },
  closeCartButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#F1F4F8', alignItems: 'center', justifyContent: 'center' },
  cartEmpty: { flex: 1, minHeight: 210, alignItems: 'center', justifyContent: 'center' },
  cartEmptyIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: '#EDF2F8', alignItems: 'center', justifyContent: 'center' },
  cartList: { flexGrow: 0, marginTop: 4 },
  cartItemRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F2F6' },
  cartItemIcon: { width: 44, height: 44, borderRadius: 13 },
  cartItemInfo: { flex: 1, minWidth: 0, marginLeft: 11 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 8 },
  quantityButton: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  quantityButtonDisabled: { opacity: 0.45 },
  quantityText: { minWidth: 14, color: '#263852', textAlign: 'center', fontSize: 13, fontWeight: '700' },
  cartFooter: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EDF0F5' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { color: '#74839A', fontSize: 14, fontWeight: '600' },
  totalPrice: { color: '#1B2C48', fontSize: 18, fontWeight: '800' },
  checkoutButton: { minHeight: 52, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 16, backgroundColor: '#1769E0' },
  checkoutButtonDisabled: { backgroundColor: '#AEBBD0' },
  checkoutText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  bottomSpace: { height: 24 },
});
