import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import { Search, SearchX, History } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { brand } from '../../theme/colors';
import { typeScale, weights } from '../../theme/typography';
import { useProducts } from '../catalog/hooks';
import { useDeliveryStore } from '../../stores/deliveryStore';
import { ProductCard } from '../../components/shared/ProductCard';
import { CollectionPill } from '../../components/shared/CollectionPill';
import { EmptyState } from '../../components/shared/EmptyState';
import { useCategories } from '../catalog/hooks';
import { storage, STORAGE_KEYS } from '../../lib/storage';

const DEBOUNCE_MS = 400;

export function SearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const store = useDeliveryStore((s) => s.store);
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    storage.get<string[]>(STORAGE_KEYS.recentSearches).then((r) => setRecent(r ?? []));
  }, []);

  const searching = debounced.length >= 2;
  const { data: results = [], isLoading } = useProducts({ search: searching ? debounced : undefined, storeId: store?.id ?? null });

  const recordSearch = () => {
    if (debounced.length < 2) return;
    setRecent((current) => {
      const next = [debounced, ...current.filter((s) => s !== debounced)].slice(0, 5);
      void storage.set(STORAGE_KEYS.recentSearches, next);
      return next;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: 56 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface, borderRadius: 999, paddingHorizontal: 14, height: 44 }}>
          <Search size={18} color={theme.colors.textMuted} />
          <TextInput
            autoFocus
            value={term}
            onChangeText={setTerm}
            placeholder="Search for products"
            placeholderTextColor={theme.colors.textFaint}
            style={{ flex: 1, color: theme.colors.text, fontSize: typeScale.body }}
            accessibilityLabel="Search for products"
          />
        </View>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" hitSlop={8}>
          <Text style={{ color: brand.primary, fontWeight: weights.semibold }}>Cancel</Text>
        </Pressable>
      </View>

      {!searching ? (
        <View style={{ padding: 16, gap: 16 }}>
          {recent.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                Recent searches
              </Text>
              {recent.map((r) => (
                <Pressable key={r} onPress={() => setTerm(r)} accessibilityRole="button">
                  <Text style={{ color: theme.colors.text, fontSize: typeScale.body }}>{r}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: typeScale.caption, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
              Browse categories
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((c) => (
                <CollectionPill key={c.id} label={c.name} onPress={() => setTerm(c.name)} />
              ))}
            </View>
          </View>
        </View>
      ) : isLoading ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.colors.textMuted }}>Searching…</Text>
        </View>
      ) : results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`No matches for "${debounced}"`}
          caption="Try a different search."
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
          contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListHeaderComponent={
            <Pressable onPress={recordSearch} accessibilityRole="button">
              <Text style={{ paddingHorizontal: 12, paddingBottom: 8, color: brand.primary, fontSize: typeScale.caption, fontWeight: weights.semibold }}>
                {results.length} results · save search
              </Text>
            </Pressable>
          }
        />
      )}
    </View>
  );
}