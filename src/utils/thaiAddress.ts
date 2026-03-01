// ===================================================
// Thai Address Utility
// Source: Local static JSON (raw database from jquery.Thailand.js)
// ===================================================

export interface AddressItem {
    district: string;  // ตำบล/แขวง
    amphoe: string;    // อำเภอ/เขต
    province: string;  // จังหวัด
    zipcode: number;
}

import addressData from "./address.json";

// In-memory cache
let _rawData: AddressItem[] = addressData as AddressItem[];
let _provinces: string[] = [];

// Fetch and parsing
export async function loadAddressData(): Promise<AddressItem[]> {
    return _rawData;
}

// Get all provinces (unique list)
export async function getProvinces(): Promise<string[]> {
    if (_provinces.length > 0) return _provinces;

    const data = await loadAddressData();
    const set = new Set(data.map(item => item.province));
    _provinces = Array.from(set).sort();
    return _provinces;
}

// Get amphoes by province name
export async function getAmphoesByProvince(provinceName: string): Promise<string[]> {
    const data = await loadAddressData();
    const set = new Set(
        data
            .filter(item => item.province === provinceName)
            .map(item => item.amphoe)
    );
    return Array.from(set).sort();
}

// Get districts (tambon) by province and amphoe
export async function getDistricts(provinceName: string, amphoeName: string): Promise<string[]> {
    const data = await loadAddressData();
    const set = new Set(
        data
            .filter(item => item.province === provinceName && item.amphoe === amphoeName)
            .map(item => item.district)
    );
    return Array.from(set).sort();
}

// Get zipcode by exact match 
export async function getZipcode(provinceName: string, amphoeName: string, districtName: string): Promise<string> {
    const data = await loadAddressData();
    const item = data.find(
        i => i.province === provinceName && i.amphoe === amphoeName && i.district === districtName
    );
    return item?.zipcode ? item.zipcode.toString() : "";
}

// Synchronous versions (if data is already loaded)
export function getProvincesSync(): string[] {
    if (!_rawData) return [];
    if (_provinces.length > 0) return _provinces;
    const set = new Set(_rawData.map(item => item.province));
    _provinces = Array.from(set).sort();
    return _provinces;
}

export function getAmphoesSync(provinceName: string): string[] {
    if (!_rawData) return [];
    const set = new Set(
        _rawData
            .filter(item => item.province === provinceName)
            .map(item => item.amphoe)
    );
    return Array.from(set).sort();
}

export function getDistrictsSync(provinceName: string, amphoeName: string): string[] {
    if (!_rawData) return [];
    const set = new Set(
        _rawData
            .filter(item => item.province === provinceName && item.amphoe === amphoeName)
            .map(item => item.district)
    );
    return Array.from(set).sort();
}

export function getZipcodeSync(provinceName: string, amphoeName: string, districtName: string): string {
    if (!_rawData) return "";
    const item = _rawData.find(
        i => i.province === provinceName && i.amphoe === amphoeName && i.district === districtName
    );
    return item?.zipcode ? item.zipcode.toString() : "";
}
