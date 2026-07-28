import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, X, Plus, Edit2, Trash2 } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { getEndpoints } from '../../utils/apiEndpoints';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import ProductImage from '../../components/ui/ProductImage';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const INTERVAL = 60_000;

export default function InventoryManagement() {
  const { admin } = useAuth();
  const role = admin?.role || 'admin';

  const [search, setSearch]     = useState('');
  const [viewMode, setViewMode] = useState('Table');

  /* ── stable: role is a primitive string dep ── */
  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get(getEndpoints(role).getProducts);
    return data.products || data.data || data || [];
  }, [role]);

  const { data: products = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL, [role]);

  const filtered  = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));
  const lowStock  = products.filter(p => (p.stock || 0) <= 5).length;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axiosInstance.delete(getEndpoints(role).deleteProduct(id));
      toast.success('Product deleted.');
      refresh();
    } catch { toast.error('Failed to delete.'); }
  };

  return (
    <PageWrapper>
      <div className="page-title-row">
        <h1 className="page-title">Inventory Management</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn--ghost">⬇ Download CSV</button>
          <button className="btn btn--ghost">⬆ CSV Upload</button>
          <button className="btn btn--primary"><Plus size={14}/> Add Product</button>
        </div>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL/1000}/>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
        {[
          { label:'Total Products', value:products.length, icon:'📦', bg:'#e8f3d6', color:'var(--primary)' },
          { label:'Low Stock',      value:lowStock,         icon:'⚠️', bg:'#fee2e2', color:'var(--danger)'  },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:500 }}>{s.label}</p>
              <p style={{ fontSize:26, fontWeight:700, color:s.color }}>{loading?'—':s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__header">
          <span className="card__title">All Products ({loading?'…':filtered.length})</span>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {['Cards','Table'].map(m=>(
              <button key={m} className={`btn btn--sm ${viewMode===m?'btn--primary':'btn--ghost'}`}
                onClick={()=>setViewMode(m)}>{m}</button>
            ))}
            <div className="search-input">
              <Search size={14}/>
              <input placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button style={{ background:'none', border:'none', cursor:'pointer' }} onClick={()=>setSearch('')}><X size={12}/></button>}
            </div>
          </div>
        </div>

        <div style={{ overflowX:'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width:32, height:32 }}/></div>
          ) : filtered.length===0 ? (
            <div className="empty-state" style={{ padding:60 }}>
              <div style={{ fontSize:48 }}>📦</div>
              <p className="empty-state__title">No products found</p>
              <p className="empty-state__text">{search?'Try a different search.':'Add your first product.'}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th><th>SKU</th><th>Image</th>
                  <th>Buy Price</th><th>Sell Price</th><th>Stock</th>
                  <th>Category</th><th>Brand</th><th>Created At</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p=>{
                  const img = imageUrl(p.images?.[0]);
                  return (
                    <tr key={p._id}>
                      <td style={{ fontWeight:500, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</td>
                      <td style={{ color:'var(--text-muted)', fontFamily:'monospace', fontSize:12 }}>{p.sku||'—'}</td>
                      <td>
                        <ProductImage src={p.images?.[0]} alt={p.name} size={38} fallback="📦" />
                      </td>
                      <td>${(p.buyPrice||0).toFixed(2)}</td>
                      <td style={{ fontWeight:600 }}>${(p.sellPrice||p.price||0).toFixed(2)}</td>
                      <td><span className={`badge ${(p.stock||0)<=5?'badge--red':'badge--green'}`}>{p.stock??0}</span></td>
                      <td style={{ color:'var(--text-secondary)', fontSize:12 }}>{p.category?.name||'—'}</td>
                      <td style={{ color:'var(--text-secondary)', fontSize:12 }}>{p.brand?.name||'—'}</td>
                      <td style={{ color:'var(--text-muted)', fontSize:12 }}>{p.createdAt?new Date(p.createdAt).toLocaleDateString():'—'}</td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn--edit btn--sm btn--icon"><Edit2 size={13}/></button>
                          <button className="btn btn--danger btn--sm btn--icon" onClick={()=>handleDelete(p._id)}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
