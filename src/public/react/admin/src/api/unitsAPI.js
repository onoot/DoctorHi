// src/api/unitsAPI.js
import { http } from './http';

export async function getAllUnits(params = {}) {
  // Build query string
  const qs = new URLSearchParams();
  if (params.type) qs.set('type', params.type);
  if (params.category) qs.set('category', params.category);
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  const response = await http.get(`/v1/admin/units${qs.toString() ? `?${qs.toString()}` : ''}`);
  if (response.success) {
    return response.units || [];
  }
  throw new Error(response.message || 'Failed to load units');
}

export async function getUnitByUniqueId(id) {
  if (!id) throw new Error('Unit id is required');
  const response = await http.get(`/v1/admin/units/${id}`);
  if (response.success) return response.unit;
  throw new Error(response.message || 'Failed to load unit');
}

export async function createUnit(unitData) {
  if (!unitData || !unitData.id || !unitData.name || !unitData.type || !unitData.category) {
    throw new Error('id, name, type and category are required');
  }
  const response = await http.post('/v1/admin/units', unitData);
  if (response.success) return response;
  throw new Error(response.message || 'Failed to create unit');
}

export async function updateUnit(id, unitData) {
  if (!id) throw new Error('Unit id is required');
  const response = await http.put(`/v1/admin/units/${id}`, unitData);
  if (response.success) return response;
  throw new Error(response.message || 'Failed to update unit');
}

export async function deleteUnit(id) {
  if (!id) throw new Error('Unit id is required');
  const response = await http.del(`/v1/admin/units/${id}`);
  if (response.success) return response;
  throw new Error(response.message || 'Failed to delete unit');
}

export async function getUnitFilterOptions() {
  const response = await http.get('/v1/admin/units/filters/options');
  if (response.success) return { types: response.types || [], categories: response.categories || [] };
  throw new Error(response.message || 'Failed to load filter options');
}

export default {
  getAllUnits,
  getUnitByUniqueId,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitFilterOptions,
};
