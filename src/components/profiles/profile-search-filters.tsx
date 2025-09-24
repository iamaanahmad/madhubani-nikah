'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, X, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { madhubaniDistrict, nearbyDistricts, getVillagesByBlock } from '@/lib/geographical-data';
import { mainSects, biradariGroups, getSubSectsBySect } from '@/lib/sect-biradari-data';
import { SearchAnalyticsService } from '@/lib/services/search-analytics.service';
import { useAuth } from '@/components/providers/auth-provider';
import { useEffect, useRef } from 'react';
import { AppwriteUtils } from '@/lib/appwrite-utils';

export type FilterState = {
  // Basic Filters
  gender: string;
  ageRange: [number, number];
  district: string;
  block: string;
  village: string;
  
  // Education & Career
  education: string[];
  occupation: string[];
  
  // Personal & Religious
  sect: string;
  subSect: string;
  biradari: string;
  familyType: string;
  maritalStatus: string;
  religiousPractice: string[];
  
  // Preferences
  photoVisibility: string;
  profileVerified: boolean;
  
  // Skills & Interests
  skills: string[];
  
  // Sorting
  sortBy: string;
  
  // Search query
  searchQuery: string;
};

type ProfileSearchFiltersProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  resultCount: number;
};

export function ProfileSearchFilters({ 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  resultCount 
}: ProfileSearchFiltersProps) {
  const { user } = useAuth();
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionId = useRef(SearchAnalyticsService.generateSessionId());
  
  // Debounced search function
  const debouncedSearch = useRef(
    AppwriteUtils.debounce((query: string, filters: FilterState) => {
      handleSearch(query, filters);
    }, 500)
  ).current;

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
    
    // Trigger debounced search for immediate filters
    if (key === 'searchQuery') {
      debouncedSearch(value, newFilters);
    } else {
      // For other filters, apply immediately
      handleSearch(newFilters.searchQuery, newFilters);
    }
  };

  const handleSearch = async (query: string, searchFilters: FilterState) => {
    try {
      // Track search analytics
      if (user) {
        await SearchAnalyticsService.trackSearch({
          userId: user.$id,
          searchQuery: query,
          filters: searchFilters,
          resultCount,
          sessionId: sessionId.current,
          userAgent: navigator.userAgent
        });
      }
    } catch (error) {
      console.warn('Failed to track search analytics:', error);
    }
  };

  // Load search suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const popularFilters = await SearchAnalyticsService.getPopularFilters(5);
        const suggestions = popularFilters.map(f => f.filter.replace(/_/g, ' '));
        setSearchSuggestions(suggestions);
      } catch (error) {
        console.warn('Failed to load search suggestions:', error);
      }
    };

    loadSuggestions();
  }, []);

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      gender: 'any',
      ageRange: [18, 60],
      district: 'any',
      block: 'any',
      village: '',
      education: [],
      occupation: [],
      sect: 'any',
      subSect: 'any',
      biradari: 'any',
      familyType: 'any',
      maritalStatus: 'single',
      religiousPractice: [],
      photoVisibility: 'any',
      profileVerified: false,
      skills: [],
      sortBy: 'newest',
      searchQuery: ''
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.gender !== 'any') count++;
    if (localFilters.ageRange[0] !== 18 || localFilters.ageRange[1] !== 60) count++;
    if (localFilters.district && localFilters.district !== 'any') count++;
    if (localFilters.block && localFilters.block !== 'any') count++;
    if (localFilters.village) count++;
    if (localFilters.education.length > 0) count++;
    if (localFilters.occupation.length > 0) count++;
    if (localFilters.sect !== 'any') count++;
    if (localFilters.subSect !== 'any') count++;
    if (localFilters.biradari !== 'any') count++;
    if (localFilters.familyType !== 'any') count++;
    if (localFilters.maritalStatus !== 'single') count++;
    if (localFilters.religiousPractice.length > 0) count++;
    if (localFilters.photoVisibility !== 'any') count++;
    if (localFilters.profileVerified) count++;
    if (localFilters.skills.length > 0) count++;
    if (localFilters.searchQuery) count++;
    return count;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-headline text-xl">
            <Filter className="h-5 w-5 text-primary" />
            Search & Filter Profiles
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{resultCount} profiles found</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()} filters active</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search Bar with Suggestions */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, profession..."
            value={localFilters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10"
          />
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg">
              <div className="p-2 text-xs text-muted-foreground border-b">Popular searches:</div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                  onClick={() => {
                    updateFilter('searchQuery', suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gender */}
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={localFilters.gender} onValueChange={(value) => updateFilter('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="male">Boy</SelectItem>
                <SelectItem value="female">Girl</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <Label>
              Age: {localFilters.ageRange[0]} - {localFilters.ageRange[1]} years
            </Label>
            <Slider
              value={localFilters.ageRange}
              onValueChange={(value) => updateFilter('ageRange', value as [number, number])}
              min={18}
              max={60}
              step={1}
              className="w-full"
            />
          </div>

          {/* District */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              District
            </Label>
            <Select value={localFilters.district} onValueChange={(value) => updateFilter('district', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any District</SelectItem>
                <SelectItem value="madhubani">Madhubani (Primary)</SelectItem>
                {nearbyDistricts.map(district => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Marital Status */}
          <div className="space-y-2">
            <Label>Marital Status</Label>
            <Select value={localFilters.maritalStatus} onValueChange={(value) => updateFilter('maritalStatus', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Secondary Filters Row - Religious & Personal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sect */}
          <div className="space-y-2">
            <Label>Sect</Label>
            <Select value={localFilters.sect} onValueChange={(value) => {
              updateFilter('sect', value);
              updateFilter('subSect', 'any'); // Reset sub-sect when sect changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select sect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {mainSects.map(sect => (
                  <SelectItem key={sect.id} value={sect.id}>
                    {sect.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-Sect */}
          <div className="space-y-2">
            <Label>Sub-Sect / Firqa</Label>
            <Select 
              value={localFilters.subSect} 
              onValueChange={(value) => updateFilter('subSect', value)}
              disabled={localFilters.sect === 'any'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sub-sect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {getSubSectsBySect(localFilters.sect).map(subSect => (
                  <SelectItem key={subSect.id} value={subSect.id}>
                    {subSect.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Biradari */}
          <div className="space-y-2">
            <Label>Biradari / Social Group</Label>
            <Select value={localFilters.biradari} onValueChange={(value) => updateFilter('biradari', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select biradari" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {biradariGroups.map(biradari => (
                  <SelectItem key={biradari.id} value={biradari.id}>
                    {biradari.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Photo Visibility */}
          <div className="space-y-2">
            <Label>Photo</Label>
            <Select value={localFilters.photoVisibility} onValueChange={(value) => updateFilter('photoVisibility', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Photo preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="available">Photo Available</SelectItem>
                <SelectItem value="blurred">Blurred Photo</SelectItem>
                <SelectItem value="none">No Photo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Third Row - Career & Education */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{/* Education */}
          <div className="space-y-2">
            <Label>Education</Label>
            <Select onValueChange={(value) => {
              if (value && !localFilters.education.includes(value)) {
                updateFilter('education', [...localFilters.education, value]);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Add education" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-formal">No Formal Education</SelectItem>
                <SelectItem value="matric">Matric (10th)</SelectItem>
                <SelectItem value="intermediate">Intermediate (12th)</SelectItem>
                <SelectItem value="graduate">Graduate</SelectItem>
                <SelectItem value="postgraduate">Postgraduate</SelectItem>
                <SelectItem value="religious">Religious Education</SelectItem>
                <SelectItem value="hafiz">Hafiz/Hafiza</SelectItem>
                <SelectItem value="alim">Alim/Alima</SelectItem>
              </SelectContent>
            </Select>
            {localFilters.education.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {localFilters.education.map((edu) => (
                  <Badge key={edu} variant="secondary" className="text-xs">
                    {edu}
                    <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => 
                      updateFilter('education', localFilters.education.filter(e => e !== edu))
                    } />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Occupation */}
          <div className="space-y-2">
            <Label>Occupation</Label>
            <Select onValueChange={(value) => {
              if (value && !localFilters.occupation.includes(value)) {
                updateFilter('occupation', [...localFilters.occupation, value]);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Add occupation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="private-job">Private Job</SelectItem>
                <SelectItem value="government-job">Government Job</SelectItem>
                <SelectItem value="business">Self-Employed / Business</SelectItem>
                <SelectItem value="homemaker">Home-maker</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="religious">Religious Work</SelectItem>
              </SelectContent>
            </Select>
            {localFilters.occupation.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {localFilters.occupation.map((occ) => (
                  <Badge key={occ} variant="secondary" className="text-xs">
                    {occ}
                    <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => 
                      updateFilter('occupation', localFilters.occupation.filter(o => o !== occ))
                    } />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select value={localFilters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort profiles by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="age-asc">Age: Low to High</SelectItem>
                <SelectItem value="age-desc">Age: High to Low</SelectItem>
                <SelectItem value="location">By Location</SelectItem>
                <SelectItem value="verified">Verified First</SelectItem>
                <SelectItem value="education">By Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              <span>Advanced Filters</span>
              {isAdvancedOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Geographical Filters */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Detailed Location (Madhubani Focus)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Block */}
                <div className="space-y-2">
                  <Label>Block</Label>
                  <Select 
                    value={localFilters.block} 
                    onValueChange={(value) => {
                      updateFilter('block', value);
                      updateFilter('village', ''); // Reset village when block changes
                    }}
                    disabled={localFilters.district !== 'madhubani'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Block</SelectItem>
                      {localFilters.district === 'madhubani' && madhubaniDistrict.blocks.map(block => (
                        <SelectItem key={block.id} value={block.id}>
                          {block.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {localFilters.district !== 'madhubani' && (
                    <p className="text-xs text-muted-foreground">Select Madhubani district to see blocks</p>
                  )}
                </div>

                {/* Village */}
                <div className="space-y-2">
                  <Label>Village</Label>
                  <Select 
                    value={localFilters.village} 
                    onValueChange={(value) => updateFilter('village', value)}
                    disabled={localFilters.block === 'any' || localFilters.district !== 'madhubani'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select village" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Village</SelectItem>
                      {localFilters.district === 'madhubani' && localFilters.block !== 'any' && 
                        getVillagesByBlock(localFilters.block).map(village => (
                          <SelectItem key={village.id} value={village.id}>
                            {village.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {(localFilters.block === 'any' || localFilters.district !== 'madhubani') && (
                    <p className="text-xs text-muted-foreground">Select a block first to see villages</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Family & Personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Family Type */}
              <div className="space-y-2">
                <Label>Family Type</Label>
                <Select value={localFilters.familyType} onValueChange={(value) => updateFilter('familyType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select family type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="nuclear">Nuclear Family</SelectItem>
                    <SelectItem value="joint">Joint Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Profile Verification */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified-only"
                    checked={localFilters.profileVerified}
                    onCheckedChange={(checked) => updateFilter('profileVerified', checked)}
                  />
                  <Label htmlFor="verified-only">Verified Profiles Only</Label>
                </div>
              </div>
            </div>

            {/* Religious Practice */}
            <div className="space-y-3">
              <Label>Religious Practice</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'daily-prayer', label: 'Daily Namaz' },
                  { id: 'hafiz', label: 'Hafiz/Hafiza' },
                  { id: 'islamic-studies', label: 'Islamic Studies' },
                  { id: 'hijab', label: 'Hijab (Sisters)' }
                ].map((practice) => (
                  <div key={practice.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={practice.id}
                      checked={localFilters.religiousPractice.includes(practice.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('religiousPractice', [...localFilters.religiousPractice, practice.id]);
                        } else {
                          updateFilter('religiousPractice', localFilters.religiousPractice.filter(p => p !== practice.id));
                        }
                      }}
                    />
                    <Label htmlFor={practice.id} className="text-sm">{practice.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills & Interests */}
            <div className="space-y-2">
              <Label>Skills & Interests</Label>
              <Select onValueChange={(value) => {
                if (value && !localFilters.skills.includes(value)) {
                  updateFilter('skills', [...localFilters.skills, value]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Add skills/interests" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teaching">Teaching</SelectItem>
                  <SelectItem value="quran-recitation">Quran Recitation</SelectItem>
                  <SelectItem value="cooking">Cooking</SelectItem>
                  <SelectItem value="it-computers">IT/Computers</SelectItem>
                  <SelectItem value="arts-crafts">Arts & Crafts</SelectItem>
                  <SelectItem value="languages">Languages</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="sewing">Sewing/Tailoring</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                  <SelectItem value="business">Business Skills</SelectItem>
                </SelectContent>
              </Select>
              {localFilters.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {localFilters.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => 
                        updateFilter('skills', localFilters.skills.filter(s => s !== skill))
                      } />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={onApplyFilters} className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            Apply Filters ({resultCount} results)
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}