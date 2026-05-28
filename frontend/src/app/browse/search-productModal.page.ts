import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

interface CategoryEntry {
  tag: string;
  displayName: string;
}

@Component({
  templateUrl: 'search-productModal.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  selector: 'search-product',
  styleUrls: ['search-productModal.page.scss']
})
export class SearchProductModalComponent implements OnInit, OnDestroy {

  public searchInput = '';
  public visibleCategories: CategoryEntry[] = CURATED_CATEGORIES;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}
  ngOnDestroy() { this.searchInput = ''; }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  filterList() {
    const q = this.searchInput.trim().toLowerCase();
    this.visibleCategories = q
      ? CURATED_CATEGORIES.filter(c => c.displayName.toLowerCase().includes(q))
      : CURATED_CATEGORIES;
  }

  search(entry: CategoryEntry) {
    return this.modalCtrl.dismiss(entry, 'confirm');
  }
}

const CURATED_CATEGORIES: CategoryEntry[] = [
  { tag: 'snacks',              displayName: 'Snacks' },
  { tag: 'beverages',           displayName: 'Beverages' },
  { tag: 'cheese',              displayName: 'Cheese' },
  { tag: 'chicken',             displayName: 'Chicken' },
  { tag: 'pizza',               displayName: 'Pizza' },
  { tag: 'pasta',               displayName: 'Pasta' },
  { tag: 'bread',               displayName: 'Bread' },
  { tag: 'breakfast-cereals',   displayName: 'Breakfast Cereals' },
  { tag: 'yogurts',             displayName: 'Yogurt' },
  { tag: 'plant-based-foods',   displayName: 'Plant-Based Foods' },
  { tag: 'frozen-foods',        displayName: 'Frozen Foods' },
  { tag: 'desserts',            displayName: 'Desserts' },
  { tag: 'sauces',              displayName: 'Sauces' },
  { tag: 'chocolates',          displayName: 'Chocolate' },
  { tag: 'cookies',             displayName: 'Cookies' },
  { tag: 'candies',             displayName: 'Candy' },
  { tag: 'ice-creams',          displayName: 'Ice Cream' },
  { tag: 'soups',               displayName: 'Soups' },
  { tag: 'juices',              displayName: 'Juices' },
  { tag: 'dairies',             displayName: 'Dairy' },
  { tag: 'milks',               displayName: 'Milk' },
  { tag: 'eggs',                displayName: 'Eggs' },
  { tag: 'meats',               displayName: 'Meats' },
  { tag: 'beef',                displayName: 'Beef' },
  { tag: 'pork',                displayName: 'Pork' },
  { tag: 'seafood',             displayName: 'Seafood' },
  { tag: 'fishes',              displayName: 'Fish' },
  { tag: 'vegetables',          displayName: 'Vegetables' },
  { tag: 'fruits',              displayName: 'Fruits' },
  { tag: 'nuts',                displayName: 'Nuts' },
  { tag: 'spreads',             displayName: 'Spreads' },
  { tag: 'salads',              displayName: 'Salads' },
  { tag: 'noodles',             displayName: 'Noodles' },
  { tag: 'rice',                displayName: 'Rice' },
  { tag: 'legumes',             displayName: 'Legumes' },
  { tag: 'condiments',          displayName: 'Condiments' },
  { tag: 'oils',                displayName: 'Oils' },
  { tag: 'spices',              displayName: 'Spices' },
  { tag: 'cereals',             displayName: 'Cereals' },
  { tag: 'biscuits',            displayName: 'Biscuits & Crackers' },
  { tag: 'canned-foods',        displayName: 'Canned Foods' },
  { tag: 'energy-drinks',       displayName: 'Energy Drinks' },
  { tag: 'alcoholic-beverages', displayName: 'Alcoholic Beverages' },
  { tag: 'baby-foods',          displayName: 'Baby Foods' },
  { tag: 'dietary-supplements', displayName: 'Dietary Supplements' },
];
