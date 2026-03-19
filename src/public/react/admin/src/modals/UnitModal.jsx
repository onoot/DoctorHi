import React, { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useApi } from '../context/ApiContext';
import ActionButton from '../common/ActionButton';
import PriceCalculator from '../common/PriceCalculator';
import { getUnitByUniqueId, createUnit, updateUnit } from '../api/unitsAPI';
import { useUnitContext } from '../context/UnitContext';

const UnitModal = ({ isOpen, onClose, unitId, onSaved, mode = 'add' }) => {
  const { http } = useApi();
  const { showNotification } = useNotification();
  const [form, setForm] = useState({ id: '', name: '', type: '', category: '', area: '', price: '' });
  const [loading, setLoading] = useState(false);
  let ctxUnit, setCtxUnit, ctxMode;
  try {
    const ctx = useUnitContext();
    ctxUnit = ctx.selectedUnit;
    setCtxUnit = ctx.setSelectedUnit;
    ctxMode = ctx.mode;
  } catch (e) {
    ctxUnit = undefined;
    setCtxUnit = undefined;
    ctxMode = undefined;
  }
  const preferredMode = ctxMode || mode;
  const [isEditingLocal, setIsEditingLocal] = useState(preferredMode !== 'view');

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset editing state based on mode (prefer context)
    setIsEditingLocal(preferredMode !== 'view');
    
    // If no unitId and no context unit, show empty form (for Add mode)
    const effectiveUnit = ctxUnit || (unitId ? null : null);
    if (!unitId && !ctxUnit) {
      setForm({ id: '', name: '', type: '', category: '', area: '', price: '' });
      return;
    }
    
    // Load existing unit data (for View/Edit mode) - prefer context
    const loadUnit = async () => {
      setLoading(true);
      try {
        const unitToUse = ctxUnit || (unitId ? await getUnitByUniqueId(unitId) : null);
        console.log('[UnitModal] Loading data for unit:', unitToUse || unitId);
        console.log('[UnitModal] Successfully loaded unit:', unitToUse);
        if (unitToUse) {
          setForm({
            id: unitToUse.id || '',
            id: unitToUse.id || '',
            name: unitToUse.name || '',
            type: unitToUse.type || '',
            category: unitToUse.category || '',
            area: unitToUse.area || '',
            price: unitToUse.price || ''
          });
        } else {
          console.warn('[UnitModal] Unit not found for id:', unitId);
          showNotification('error', 'Unit not found');
        }
      } catch (err) {
        console.error('[UnitModal] Error loading unit:', err);
        showNotification('error', 'Failed to load unit: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadUnit();
  }, [isOpen, unitId, mode, showNotification, ctxUnit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const preparePayload = (forCreate = false) => {
    const payload = {};
    if (forCreate) {
      payload.id = form.id || (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `uid-${Date.now()}`);
    }
    if (form.id) payload.id = form.id;
    if (form.name) payload.name = form.name;
    if (form.type) payload.type = form.type;
    if (form.category) payload.category = form.category;
    // Only include numeric values if not empty and valid
    if (form.area !== '' && form.area !== null && form.area !== undefined) {
      const numArea = Number(String(form.area).replace(/,/g, ''));
      if (!Number.isNaN(numArea)) payload.area = numArea;
    }
    if (form.price !== '' && form.price !== null && form.price !== undefined) {
      const numPrice = Number(String(form.price).replace(/,/g, ''));
      if (!Number.isNaN(numPrice)) payload.price = numPrice;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (unitId || ctxUnit) {
        const uid = (ctxUnit && ctxUnit.id) || unitId;
        const payload = preparePayload(false);
        if (Object.keys(payload).length === 0) throw new Error('No data to update');
        await updateUnit(uid, payload);
        showNotification('success', 'Unit updated');
      } else {
        // Generate id if not provided (browser supports crypto.randomUUID)
          const payload = preparePayload(true);
          await createUnit(payload);
        showNotification('success', 'Unit created');
      }
      onSaved?.();
      // Clear context selected unit if provider exists
      if (setCtxUnit) setCtxUnit(null);
      onClose();
    } catch (err) {
      showNotification('error', err.message || 'Failed to save unit');
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    if (setCtxUnit) setCtxUnit(null);
    onClose?.();
  };

  return (
    <div className="modal show">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>{preferredMode === 'view' ? (isEditingLocal ? 'Edit Unit' : 'View Unit') : (unitId ? 'Edit Unit' : 'Add Unit')}</h3>
          <span className="modal-close" onClick={handleClose}>&times;</span>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Display unique id for existing records */}
            

            {/* ID removed as requested */}
            <div className="form-group required">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} disabled={preferredMode === 'view' && !isEditingLocal} className="form-control" />
            </div>
            <div className="form-group required">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleChange} disabled={preferredMode === 'view' && !isEditingLocal} className="form-control">
                <option value="">Select Type</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="parking">Parking</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category / Floor</label>
              <input name="category" value={form.category} onChange={handleChange} disabled={preferredMode === 'view' && !isEditingLocal} className="form-control" />
            </div>
            <div className="form-group">
              <label>Area (sqft)</label>
              <input name="area" value={form.area} onChange={handleChange} disabled={preferredMode === 'view' && !isEditingLocal} className="form-control" />
            </div>

            <PriceCalculator
              pricePKR={form.price}
              area={form.area}
              onPriceChange={(value) => setForm({ ...form, price: value })}
              disabled={preferredMode === 'view' && !isEditingLocal}
            />
            <div className="modal-footer">
              {preferredMode === 'view' && !isEditingLocal && (
                <ActionButton variant="edit" onClick={() => setIsEditingLocal(true)}>Edit</ActionButton>
              )}
              {isEditingLocal && (
                <>
                          <ActionButton type="submit" variant="edit">Save</ActionButton>
                  <ActionButton variant="warn" onClick={() => {
                    // Reset changes and return to view mode, then close
                    (async () => {
                      setLoading(true);
                      try {
                        if (ctxUnit) {
                          // restore from context if available
                          setForm({ id: ctxUnit.id || '', id: ctxUnit.id || '', name: ctxUnit.name || '', type: ctxUnit.type || '', category: ctxUnit.category || '', area: ctxUnit.area || '', price: ctxUnit.price || '' });
                        } else if (unitId) {
                          const unit = await getUnitByUniqueId(unitId);
                          if (unit) setForm({ id: unit.id || '', id: unit.id || '', name: unit.name || '', type: unit.type || '', category: unit.category || '', area: unit.area || '', price: unit.price || '' });
                        } else {
                          setForm({ id: '', name: '', type: '', category: '', area: '', price: '' });
                        }
                      } catch (err) {
                        showNotification('error', 'Failed to reload unit');
                      } finally {
                        setLoading(false);
                        setIsEditingLocal(preferredMode !== 'view');
                      }
                    })().finally(() => {
                      // close the modal after reverting
                      handleClose();
                    });
                  }}>Cancel</ActionButton>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UnitModal;
