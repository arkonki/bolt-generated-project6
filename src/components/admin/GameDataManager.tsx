import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Wand2, 
  Sword, 
  Shield, 
  Search, 
  Filter, 
  Plus, 
  Save, 
  X, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import { Button } from '../shared/Button';
import { ArmorHelmetsForm } from './ItemForms/ArmorHelmetsForm';
import { MeleeWeaponsForm } from './ItemForms/MeleeWeaponsForm';
import { RangedWeaponsForm } from './ItemForms/RangedWeaponsForm';
import { ClothesForm } from './ItemForms/ClothesForm';
import { MusicalInstrumentsForm } from './ItemForms/MusicalInstrumentsForm';
import { TradeGoodsForm } from './ItemForms/TradeGoodsForm';
import { StudiesMagicForm } from './ItemForms/StudiesMagicForm';
import { LightSourcesForm } from './ItemForms/LightSourcesForm';
import { ToolsForm } from './ItemForms/ToolsForm';
import { ContainersForm } from './ItemForms/ContainersForm';
import { MedicineForm } from './ItemForms/MedicineForm';
import { ServicesForm } from './ItemForms/ServicesForm';
import { HuntingFishingForm } from './ItemForms/HuntingFishingForm';
import { MeansOfTravelForm } from './ItemForms/MeansOfTravelForm';
import { AnimalsForm } from './ItemForms/AnimalsForm';


type DataCategory = 'spells' | 'items' | 'abilities' | 'kin' | 'profession';

interface GameDataEntry {
  id?: string;
  name: string;
  description?: string;
  // Fields specific to spells/items/abilities remain here…
  // For Kin:
  heroic_ability?: string;
  abilities?: { description: string; willpower_points: number }[];
  // For Profession:
  key_attribute?: string;
  skills?: string[];
  // Additional properties as needed
  [key: string]: any;
}

interface ItemFormProps {
  entry: any;
  onChange: (field: string, value: any) => void;
}

const itemCategories = [
  'ARMOR & HELMETS',
  'MELEE WEAPONS',
  'RANGED WEAPONS',
  'CLOTHES',
  'MUSICAL INSTRUMENTS',
  'TRADE GOODS',
  'STUDIES & MAGIC',
  'LIGHT SOURCES',
  'TOOLS',
  'CONTAINERS',
  'MEDICINE',
  'SERVICES',
  'HUNTING & FISHING',
  'MEANS OF TRAVEL',
  'ANIMALS'
];

const itemFormComponents: Record<string, React.ComponentType<ItemFormProps>> = {
  'ARMOR & HELMETS': ArmorHelmetsForm,
  'MELEE WEAPONS': MeleeWeaponsForm,
  'RANGED WEAPONS': RangedWeaponsForm,
  'CLOTHES': ClothesForm,
  'MUSICAL INSTRUMENTS': MusicalInstrumentsForm,
  'TRADE GOODS': TradeGoodsForm,
  'STUDIES & MAGIC': StudiesMagicForm,
  'LIGHT SOURCES': LightSourcesForm,
  'TOOLS': ToolsForm,
  'CONTAINERS': ContainersForm,
  'MEDICINE': MedicineForm,
  'SERVICES': ServicesForm,
  'HUNTING & FISHING': HuntingFishingForm,
  'MEANS OF TRAVEL': MeansOfTravelForm,
  'ANIMALS': AnimalsForm
};

export function GameDataManager() {
  const [activeCategory, setActiveCategory] = useState<DataCategory>('spells');
  const [entries, setEntries] = useState<GameDataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState<GameDataEntry | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Load entries based on activeCategory
  useEffect(() => {
    loadEntries();
  }, [activeCategory]);

  async function loadEntries() {
    try {
      setLoading(true);
      setError(null);

      let query;
      switch (activeCategory) {
        case 'spells':
          query = supabase
            .from('game_spells')
            .select(`
              *,
              magic_schools (
                name
              )
            `)
            .order('name');
          break;
        case 'items':
          query = supabase
            .from('game_items')
            .select('*')
            .order('name');
          break;
        case 'abilities':
          query = supabase
            .from('heroic_abilities')
            .select('*')
            .order('name');
          break;
        case 'kin':
          query = supabase
            .from('kin')
            .select('*')
            .order('name');
          break;
        case 'profession':
          query = supabase
            .from('professions')
            .select('*')
            .order('name');
          break;
        default:
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!editingEntry) return;
    try {
      setError(null);
      const { id, ...data } = editingEntry;
      let table;
      switch (activeCategory) {
        case 'spells':
          table = 'game_spells';
          break;
        case 'items':
          table = 'game_items';
          break;
        case 'abilities':
          table = 'heroic_abilities';
          break;
        case 'kin':
          table = 'kin';
          break;
        case 'profession':
          table = 'professions';
          break;
        default:
          break;
      }

      if (id) {
        const { error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert([data]);
        if (error) throw error;
      }

      setEditingEntry(null);
      loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
      console.error("Error during save:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      const table = activeCategory === 'spells'
        ? 'game_spells'
        : activeCategory === 'items'
        ? 'game_items'
        : activeCategory === 'abilities'
        ? 'heroic_abilities'
        : activeCategory === 'kin'
        ? 'kin'
        : 'professions';

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const handleItemFieldChange = (field: string, value: any) => {
    setEditingEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Compute filtered entries (search filtering applies for all)
  const filteredEntries = entries.filter(entry => {
    const lowerSearch = searchTerm.toLowerCase();
    return !searchTerm ||
      entry.name.toLowerCase().includes(lowerSearch) ||
      (entry.description && entry.description.toLowerCase().includes(lowerSearch));
  });

  // List of skills for Profession (sorted alphabetically)
  const allSkills: string[] = [
    'Acrobatics', 'Animism', 'Awareness', 'Axes', 'Bartering', 'Beast Lore', 'Bluffing', 'Bows', 'Brawling', 'Bushcraft', 'Crossbows', 'Crafting', 'Evade', 'Elementalism', 'Healing', 'Hammers', 'Hunting & Fishing', 'Knives', 'Languages', 'Mentalism', 'Myths & Legends', 'Performance', 'Persuasion', 'Riding', 'Seamanship', 'Sleight of Hand', 'Sneaking', 'Slings', 'Spears', 'Spot Hidden', 'Staves', 'Swords', 'Swimming'
  ].sort();

  const renderForm = () => {
    if (!editingEntry) return null;
    switch (activeCategory) {
      case 'spells':
        return (
          <div className="space-y-4">
            {/* Existing Spells form fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={editingEntry.name}
                onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School
              </label>
              <select
                value={editingEntry.school_id || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, school_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">General Magic</option>
                <option value="e7836c1c-517a-41f8-bd71-92ba20d9c9e1">Animism</option>
                <option value="6d2d7686-da89-4c42-a763-6b143c1dac60">Elementalism</option>
                <option value="b500058b-543f-4c44-a097-911102245236">Mentalism</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rank
              </label>
              <select
                value={editingEntry.rank !== undefined ? editingEntry.rank : 1}
                onChange={(e) => setEditingEntry({ ...editingEntry, rank: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="0">Trick</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Rank {i + 1}</option>
                ))}
              </select>
            </div>

						<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prerequisite
                </label>
                <input
                  type="text"
                  value={editingEntry.prerequisite}
                  onChange={(e) => setEditingEntry({ ...editingEntry, prerequisite: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
									<p className="text-xs text-gray-500 mt-1">
    								Enter prerequisite details (e.g., "Must know Fireball" or "Prior spellcasting experience")
 								 </p>
              </div>

						<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirement
                </label>
                <input
                  type="text"
                  value={editingEntry.requirement}
                  onChange={(e) => setEditingEntry({ ...editingEntry, requirement: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
									
										/>
									<p className="text-xs text-gray-500 mt-1">
    								To cast a spell, you must fulfill one or more requirements
										which are specified in the description of each spell.
 								 </p>
            
              </div>
						
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editingEntry.description}
                onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Casting Time
                </label>
                <input
                  type="text"
                  value={editingEntry.casting_time}
                  onChange={(e) => setEditingEntry({ ...editingEntry, casting_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Range
                </label>
                <input
                  type="text"
                  value={editingEntry.range}
                  onChange={(e) => setEditingEntry({ ...editingEntry, range: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
  							<label className="block text-sm font-medium text-gray-700 mb-1">
   								 Duration
 									 </label>
 											 <select
   												 value={editingEntry.duration || ""}
   													 onChange={(e) => setEditingEntry({ ...editingEntry, duration: e.target.value })}
   													 className="w-full px-3 py-2 border rounded-md"
 														 >
   													 <option value="">Select Duration</option>
   													 <option value="Instant">Instant</option>
    												 <option value="Round">Round</option>
														 <option value="Stretch">Stretch</option>
    												 <option value="Shift">Shift</option>
														 <option value="Concentration">Concentration</option>
    												 <option value="Permanent">Permanent</option>
 														 </select>
													</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Willpower Cost
                </label>
                <input
                  type="number"
                  value={editingEntry.willpower_cost}
                  onChange={(e) => setEditingEntry({ ...editingEntry, willpower_cost: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                />
									<p className="text-xs text-gray-500 mt-1">
   									 Casting a spell costs 2 WP per power level. In other words, normal spells always cost at least 2 WP, and magic tricks always cost 1 WP. 
										Some spells do not use power level – these always cost 2 WP.
 									 </p>
              </div>
            </div>
          </div>
        );
      case 'items':
        const ItemFormComponent = itemFormComponents[editingEntry.category];
        if (ItemFormComponent) {
          return <ItemFormComponent entry={editingEntry} onChange={handleItemFieldChange} />;
        } else {
          return (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={editingEntry.category || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select Category</option>
                {itemCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          );
        }
        break;
      case 'abilities':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editingEntry.name || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editingEntry.description || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Willpower Cost</label>
              <input
                type="number"
                value={editingEntry.willpower_cost || 0}
                onChange={(e) =>
                  setEditingEntry({ ...editingEntry, willpower_cost: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
              <input
                type="text"
                value={editingEntry.profession || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, profession: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirement</label>
              <input
                type="text"
                value={editingEntry.requirement || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, requirement: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        );
        break;
      case 'kin':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editingEntry.name || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editingEntry.description || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heroic Ability</label>
              <input
                type="text"
                value={editingEntry.heroic_ability || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, heroic_ability: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abilities</label>
              {(editingEntry.abilities || []).map((ability: any, idx: number) => (
                <div key={idx} className="flex gap-2 items-center mb-1">
                  <input
                    type="text"
                    placeholder="Ability Description"
                    value={ability.description || ''}
                    onChange={(e) => {
                      const abilities = editingEntry.abilities ? [...editingEntry.abilities] : [];
                      abilities[idx] = { ...abilities[idx], description: e.target.value };
                      setEditingEntry({ ...editingEntry, abilities });
                    }}
                    className="border rounded-md px-2 py-1 flex-1"
                  />
                  <input
                    type="number"
                    placeholder="Willpower Points"
                    value={ability.willpower_points || 0}
                    onChange={(e) => {
                      const abilities = editingEntry.abilities ? [...editingEntry.abilities] : [];
                      abilities[idx] = { ...abilities[idx], willpower_points: parseInt(e.target.value) };
                      setEditingEntry({ ...editingEntry, abilities });
                    }}
                    className="border rounded-md px-2 py-1 w-20"
                    min="0"
                  />
                  <button
                    onClick={() => {
                      const abilities = editingEntry.abilities ? [...editingEntry.abilities] : [];
                      abilities.splice(idx, 1);
                      setEditingEntry({ ...editingEntry, abilities });
                    }}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const abilities = editingEntry.abilities ? [...editingEntry.abilities] : [];
                  abilities.push({ description: '', willpower_points: 0 });
                  setEditingEntry({ ...editingEntry, abilities });
                }}
                className="mt-2 text-blue-600"
              >
                Add Ability
              </button>
            </div>
          </div>
        );
      case 'profession':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editingEntry.name || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editingEntry.description || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Attribute</label>
              <input
                type="text"
                value={editingEntry.key_attribute || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, key_attribute: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heroic Ability</label>
              <input
                type="text"
                value={editingEntry.heroic_ability || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, heroic_ability: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <div className="grid grid-cols-3 gap-2">
                {allSkills.map(skill => (
                  <label key={skill} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={editingEntry.skills ? editingEntry.skills.includes(skill) : false}
                      onChange={(e) => {
                        let skills = editingEntry.skills ? [...editingEntry.skills] : [];
                        if (e.target.checked) {
                          skills.push(skill);
                        } else {
                          skills = skills.filter(s => s !== skill);
                        }
                        setEditingEntry({ ...editingEntry, skills });
                      }}
                    />
                    <span className="text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Game Data Management</h2>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setEditingEntry({})}
        >
          Add Entry
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4 border-b">
        {/* Existing category buttons */}
        <button
          onClick={() => {
            setActiveCategory('spells');
            setFilter('all');
          }}
          className={`px-4 py-2 font-medium ${
            activeCategory === 'spells'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Spells
        </button>
        <button
          onClick={() => {
            setActiveCategory('items');
            setFilter('all');
          }}
          className={`px-4 py-2 font-medium ${
            activeCategory === 'items'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Items
        </button>
        <button
          onClick={() => {
            setActiveCategory('abilities');
            setFilter('all');
          }}
          className={`px-4 py-2 font-medium ${
            activeCategory === 'abilities'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Abilities
        </button>
        <button
          onClick={() => {
            setActiveCategory('kin');
            setFilter('all');
          }}
          className={`px-4 py-2 font-medium ${
            activeCategory === 'kin'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Kin
        </button>
        <button
          onClick={() => {
            setActiveCategory('profession');
            setFilter('all');
          }}
          className={`px-4 py-2 font-medium ${
            activeCategory === 'profession'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Profession
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border rounded-lg appearance-none bg-white"
          >
            <option value="all">All</option>
            {/* Optionally adjust filter options based on category */}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Name</th>
              {activeCategory === 'spells' && (
                <>
                  <th className="px-4 py-2 text-left">School</th>
                  <th className="px-4 py-2 text-left">Rank</th>
                  <th className="px-4 py-2 text-left">WP Cost</th>
                </>
              )}
              {activeCategory === 'abilities' && (
                <>
                  <th className="px-4 py-2 text-left">WP Cost</th>
                </>
              )}
              {activeCategory === 'kin' && (
                <>
                  <th className="px-4 py-2 text-left">Heroic Ability</th>
                </>
              )}
              {activeCategory === 'profession' && (
                <>
                  <th className="px-4 py-2 text-left">Key Attribute</th>
                </>
              )}
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="px-4 py-2">{entry.name}</td>
                {activeCategory === 'spells' && (
                  <>
                    <td className="px-4 py-2">{entry.magic_schools?.name || 'General Magic'}</td>
                    <td className="px-4 py-2">{entry.rank === 0 ? 'Trick' : `Rank ${entry.rank}`}</td>
                    <td className="px-4 py-2">{entry.willpower_cost} WP</td>
                  </>
                )}
                {activeCategory === 'abilities' && (
                  <>
                    <td className="px-4 py-2">{entry.willpower_cost} WP</td>
                  </>
                )}
                {activeCategory === 'kin' && (
                  <>
                    <td className="px-4 py-2">{entry.heroic_ability}</td>
                  </>
                )}
                {activeCategory === 'profession' && (
                  <>
                    <td className="px-4 py-2">{entry.key_attribute}</td>
                  </>
                )}
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => setEditingEntry(entry)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(entry.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingEntry.id ? 'Edit Entry' : 'New Entry'}
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderForm()}

            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="secondary"
                onClick={() => setEditingEntry(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
