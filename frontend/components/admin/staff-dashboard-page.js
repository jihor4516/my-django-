'use client';

import { useEffect, useState } from 'react';
import EmptyState from '@/components/ui/empty-state';
import StatusBadge from '@/components/ui/status-badge';
import KpiGrid from '@/components/dashboard/kpi-grid';
import {
  createStaffCategory,
  createStaffItem,
  createStaffNotification,
  getApiBase,
  getStaffClients,
  getStaffDashboard,
  getStaffItems,
  getStaffRequests,
  processStaffRequest,
  resolveBackendFileUrl,
  uploadStaffItemImage,
  updateStaffItem,
} from '@/lib/client-api';
import { formatMoney } from '@/lib/format';
import { useLanguage } from '@/components/i18n/language-provider';

const initialItemForm = {
  serial_number: '',
  name_ar: '',
  name_fr: '',
  name_en: '',
  description_ar: '',
  description_fr: '',
  description_en: '',
  category_id: '',
  status: 'available',
  condition: 'good',
  quantity_total: 1,
  quantity_available: 1,
  storage_location: '',
  is_featured: false,
};

const initialCategoryForm = {
  name_ar: '',
  name_fr: '',
  name_en: '',
  icon: 'package',
  color: '#c9912e',
};

const initialNotificationForm = {
  title: '',
  message: '',
  recipient_id: '',
  action_url: '/account',
  send_to_all: false,
};

export default function StaffDashboardPage() {
  const apiBase = getApiBase();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [notificationForm, setNotificationForm] = useState(initialNotificationForm);
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [editingId, setEditingId] = useState(null);
  const [requestFilter, setRequestFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [requestNotes, setRequestNotes] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imageIsMain, setImageIsMain] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [latestGeneratedDocs, setLatestGeneratedDocs] = useState(null);

  const tabs = [
    { id: 'overview', label: t('adminDashboard.tabOverview', 'Overview') },
    { id: 'requests', label: t('adminDashboard.tabRequests', 'Rental requests') },
    { id: 'notifications', label: t('adminDashboard.tabNotifications', 'Notifications') },
    { id: 'inventory', label: t('adminDashboard.tabInventory', 'Inventory') },
    { id: 'new-item', label: t('adminDashboard.tabNewItem', 'Add or edit item') },
  ];

  async function loadPage(status = requestFilter, activeLang = lang) {
    const [dashboardResponse, requestsResponse, itemsResponse, clientsResponse, categoriesResponse] = await Promise.all([
      getStaffDashboard(activeLang),
      getStaffRequests(status, activeLang),
      getStaffItems(activeLang),
      getStaffClients(),
      fetch(`${apiBase}/categories/?lang=${activeLang}`).then((response) => response.json()),
    ]);

    setDashboard(dashboardResponse);
    setRequests(requestsResponse.results || []);
    setItems(itemsResponse.results || []);
    setClients(clientsResponse.results || []);
    setCategories(categoriesResponse.results || []);
  }

  useEffect(() => {
    loadPage(requestFilter, lang)
      .catch((requestError) => {
        if (requestError.status === 401 || requestError.status === 403) {
          window.location.href = '/login?next=/admin';
          return;
        }
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [lang]);

  function updateFormField(key, value) {
    setItemForm((current) => ({ ...current, [key]: value }));
  }

  function updateCategoryField(key, value) {
    setCategoryForm((current) => ({ ...current, [key]: value }));
  }

  function updateNotificationField(key, value) {
    setNotificationForm((current) => ({ ...current, [key]: value }));
  }

  function editItem(item) {
    setEditingId(item.id);
    setTab('new-item');
    setItemForm({
      ...initialItemForm,
      serial_number: item.serial_number || '',
      name_ar: item.name_ar || '',
      name_fr: item.name_fr || '',
      name_en: item.name_en || '',
      description_ar: item.description_ar || '',
      description_fr: item.description_fr || '',
      description_en: item.description_en || '',
      category_id: item.category_id || item.category?.id || '',
      status: item.status || 'available',
      condition: item.condition || 'good',
      quantity_total: item.quantity_total || 1,
      quantity_available: item.quantity_available || 1,
      storage_location: item.storage_location || '',
      is_featured: Boolean(item.is_featured),
    });
  }

  async function handleProcessRequest(id, action) {
    setError('');
    setMessage('');
    try {
      const response = await processStaffRequest(id, {
        action,
        staff_note: (requestNotes[id] || '').trim(),
      });
      setMessage(
        action === 'approve'
          ? t('adminDashboard.requestApprovedSuccess', 'Request approved and contract generated successfully.')
          : t('adminDashboard.requestRejectedSuccess', 'Request rejected successfully.')
      );
      setLatestGeneratedDocs(action === 'approve' ? { contract: response.contract } : null);
      setRequestNotes((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await loadPage(requestFilter, lang);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleFilterChange(status) {
    setRequestFilter(status);
    try {
      const response = await getStaffRequests(status, lang);
      setRequests(response.results || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSubmitItem(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      if (editingId) {
        const updateResponse = await updateStaffItem(editingId, {
          serial_number: itemForm.serial_number,
          name_ar: itemForm.name_ar,
          name_fr: itemForm.name_fr,
          name_en: itemForm.name_en,
          description_ar: itemForm.description_ar,
          description_fr: itemForm.description_fr,
          description_en: itemForm.description_en,
          category_id: Number(itemForm.category_id),
          status: itemForm.status,
          condition: itemForm.condition,
          quantity_total: Number(itemForm.quantity_total),
          quantity_available: Number(itemForm.quantity_available),
          storage_location: itemForm.storage_location,
          is_featured: itemForm.is_featured,
        });
        setEditingId(updateResponse.item.id);
        setMessage(t('adminDashboard.itemUpdatedSuccess', 'Item updated successfully.'));
      } else {
        const createResponse = await createStaffItem({
          ...itemForm,
          category_id: Number(itemForm.category_id),
          quantity_total: Number(itemForm.quantity_total),
          quantity_available: Number(itemForm.quantity_available),
        });
        setEditingId(createResponse.item.id);
        setMessage(t('adminDashboard.itemAddedSuccess', 'Item added successfully.'));
      }
      await loadPage(requestFilter, lang);
      setTab('new-item');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    setSavingCategory(true);
    setMessage('');
    setError('');
    try {
      const response = await createStaffCategory(categoryForm);
      setMessage(t('adminDashboard.categoryAddedSuccess', 'Category added successfully.'));
      setCategoryForm(initialCategoryForm);
      await loadPage(requestFilter, lang);
      if (response.category?.id) {
        setItemForm((current) => ({ ...current, category_id: response.category.id }));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleSendNotification(event) {
    event.preventDefault();
    if (!notificationForm.send_to_all && !notificationForm.recipient_id) {
      setError(t('adminDashboard.selectClientError', 'Choose a client or enable sending to all clients.'));
      return;
    }
    setSendingNotification(true);
    setMessage('');
    setError('');
    try {
      await createStaffNotification({
        title: notificationForm.title,
        message: notificationForm.message,
        action_url: notificationForm.action_url,
        send_to_all: notificationForm.send_to_all,
        recipient_id: notificationForm.send_to_all ? null : Number(notificationForm.recipient_id),
      });
      setMessage(t('adminDashboard.notificationSentSuccess', 'Notification sent successfully.'));
      setNotificationForm(initialNotificationForm);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSendingNotification(false);
    }
  }

  async function handleImageUpload(event) {
    event.preventDefault();
    if (!editingId || !imageFile) {
      setError(t('adminDashboard.imageUploadError', 'Choose a saved item and an image to upload.'));
      return;
    }
    setUploadingImage(true);
    setError('');
    setMessage('');
    try {
      await uploadStaffItemImage(editingId, { imageFile, isMain: imageIsMain });
      setMessage(t('adminDashboard.imageUploadedSuccess', 'Item image uploaded successfully.'));
      setImageFile(null);
      await loadPage(requestFilter, lang);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploadingImage(false);
    }
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner" /><span>{t('adminDashboard.loading', 'Loading the dashboard...')}</span></div>;
  }

  if (!dashboard) {
    return <EmptyState icon="!" title={t('adminDashboard.loadTitle', 'Unable to load the dashboard')} description={error || t('adminDashboard.loadDescription', 'Please sign in with a staff account.')} actionHref="/login" actionLabel={t('adminDashboard.loginAction', 'Login')} />;
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t('adminDashboard.eyebrow', 'Staff Admin')}</p>
        <h1>{t('adminDashboard.title', 'Staff operations dashboard')}</h1>
        <p className="text-muted">{t('adminDashboard.subtitle', 'Manage requests, notifications, and inventory from one internal workspace.')}</p>
      </section>

      {message ? <div className="alert alert-ok mt-4">{message}</div> : null}
      {error ? <div className="alert alert-danger mt-4">{error}</div> : null}
      {latestGeneratedDocs?.contract ? (
        <div className="card mt-4">
          <h2 style={{ marginBottom: '12px' }}>{t('adminDashboard.contractReadyTitle', 'Generated contract')}</h2>
          <p className="text-muted" style={{ marginBottom: '14px' }}>
            {t('adminDashboard.contractReadyText', 'The contract has been generated and is available from the client account.')} {latestGeneratedDocs.contract?.contract_number}
          </p>
          <div className="row-actions">
            {latestGeneratedDocs.contract?.contract_preview_url ? <a className="btn btn-primary btn-sm" href={resolveBackendFileUrl(latestGeneratedDocs.contract.contract_preview_url)} target="_blank" rel="noreferrer">{t('adminDashboard.contractPreview', 'Preview contract')}</a> : null}
            {latestGeneratedDocs.contract?.contract_preview_url ? <a className="btn btn-ok btn-sm" href={resolveBackendFileUrl(`${latestGeneratedDocs.contract.contract_preview_url}?print=1`)} target="_blank" rel="noreferrer">{t('adminDashboard.contractPrint', 'Print contract')}</a> : null}
            {latestGeneratedDocs.contract?.contract_pdf_url ? <a className="btn btn-ghost btn-sm" href={resolveBackendFileUrl(latestGeneratedDocs.contract.contract_pdf_url)} target="_blank" rel="noreferrer">{t('adminDashboard.contractDownload', 'Download contract PDF')}</a> : null}
          </div>
        </div>
      ) : null}

      <div className="tabs mt-4">
        {tabs.map((tabItem) => (
          <button key={tabItem.id} type="button" className={`tab-btn ${tab === tabItem.id ? 'active' : ''}`} onClick={() => setTab(tabItem.id)}>
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <section className="section-block mt-0">
          <KpiGrid
            items={[
              { icon: '□', label: t('adminDashboard.countItemsTotal', 'Total items'), value: dashboard.counts.items_total },
              { icon: '✓', label: t('adminDashboard.countItemsAvailable', 'Available items'), value: dashboard.counts.items_available },
              { icon: '◌', label: t('adminDashboard.countTenants', 'Clients'), value: dashboard.counts.tenants_total },
              { icon: '▣', label: t('adminDashboard.countContracts', 'Contracts'), value: dashboard.counts.contracts_total },
              { icon: '△', label: t('adminDashboard.countActiveContracts', 'Active contracts'), value: dashboard.counts.active_contracts },
              { icon: '⌛', label: t('adminDashboard.countPendingRequests', 'Pending requests'), value: dashboard.counts.pending_requests },
            ]}
          />
          <div className="card mt-6">
            <h2 style={{ marginBottom: '18px' }}>{t('adminDashboard.recentContracts', 'Latest contracts')}</h2>
            {(dashboard.recent_contracts || []).length === 0 ? (
              <EmptyState icon="□" title={t('adminDashboard.noContractsTitle', 'No contracts yet')} description={t('adminDashboard.noContractsText', 'Generated contracts will appear here after requests are approved.')} />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>{t('adminDashboard.contractNumber', 'Contract #')}</th><th>{t('adminDashboard.eventName', 'Event')}</th><th>{t('adminDashboard.statusLabel', 'Status')}</th><th>{t('adminDashboard.amountLabel', 'Amount')}</th><th>{t('adminDashboard.documentsLabel', 'Documents')}</th></tr></thead>
                  <tbody>
                    {dashboard.recent_contracts.map((contract) => (
                      <tr key={contract.id}><td>{contract.contract_number}</td><td>{contract.event_name || t('adminDashboard.untitledEvent', 'Untitled event')}</td><td><StatusBadge status={contract.status} /></td><td>{formatMoney(contract.total_amount)} {t('adminDashboard.currency', 'MAD')}</td><td><div className="row-actions">{contract.contract_preview_url ? <a className="btn btn-primary btn-sm" href={resolveBackendFileUrl(contract.contract_preview_url)} target="_blank" rel="noreferrer">{t('adminDashboard.contractPreview', 'Preview contract')}</a> : null}{contract.contract_preview_url ? <a className="btn btn-ok btn-sm" href={resolveBackendFileUrl(`${contract.contract_preview_url}?print=1`)} target="_blank" rel="noreferrer">{t('adminDashboard.contractPrint', 'Print contract')}</a> : null}{contract.contract_pdf_url ? <a className="btn btn-ghost btn-sm" href={resolveBackendFileUrl(contract.contract_pdf_url)} target="_blank" rel="noreferrer">{t('adminDashboard.contractPdf', 'Contract PDF')}</a> : null}</div></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'requests' ? (
        <section className="section-block mt-0">
          <div className="row-actions mb-4">
            {['pending', 'approved', 'rejected', ''].map((status) => (
              <button key={status || 'all'} type="button" className={`btn btn-sm ${requestFilter === status ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handleFilterChange(status)}>
                {status === 'pending' ? t('adminDashboard.filterPending', 'Pending') : status === 'approved' ? t('adminDashboard.filterApproved', 'Approved') : status === 'rejected' ? t('adminDashboard.filterRejected', 'Rejected') : t('adminDashboard.filterAll', 'All')}
              </button>
            ))}
          </div>
          {requests.length === 0 ? <EmptyState icon="⌕" title={t('adminDashboard.noRequestsTitle', 'No requests in this filter')} description={t('adminDashboard.noRequestsText', 'New client requests will appear here automatically.')} /> : (
            <div className="stack-list">
              {requests.map((request) => (
                <article key={request.id} className="request-row">
                  <div className="request-info">
                    <strong>{request.item?.name}</strong>
                    <small>{request.user?.full_name || request.user?.username}</small>
                    <div className="meta"><span className="text-xs text-muted">{t('adminDashboard.quantityLabel', 'Quantity')}: {request.qty}</span>{request.event_name ? <span className="text-xs text-muted">{request.event_name}</span> : null}{request.venue ? <span className="text-xs text-muted">{request.venue}</span> : null}</div>
                    {request.status === 'pending' ? <textarea className="input" rows="2" placeholder={t('adminDashboard.staffNotePlaceholder', 'Staff note (optional)')} value={requestNotes[request.id] || ''} onChange={(e) => setRequestNotes((current) => ({ ...current, [request.id]: e.target.value }))} style={{ marginTop: '10px' }} /> : null}
                    {request.staff_note ? <p className="text-xs text-muted">{t('adminDashboard.noteLabel', 'Note')}: {request.staff_note}</p> : null}
                  </div>
                  <div className="request-actions">
                    <StatusBadge status={request.status} />
                    {request.status === 'pending' ? <div className="row-actions"><button type="button" className="btn btn-ok btn-sm" onClick={() => handleProcessRequest(request.id, 'approve')}>{t('adminDashboard.approveAction', 'Approve')}</button><button type="button" className="btn btn-danger btn-sm" onClick={() => handleProcessRequest(request.id, 'reject')}>{t('adminDashboard.rejectAction', 'Reject')}</button></div> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'notifications' ? (
        <section className="section-block mt-0">
          <form className="card" onSubmit={handleSendNotification}>
            <h2 style={{ marginBottom: '18px' }}>{t('adminDashboard.sendNotificationTitle', 'Send an in-app notification')}</h2>
            <div className="form-grid cols-2">
              <div className="form-group"><label className="form-label">{t('adminDashboard.notificationTitleLabel', 'Notification title')}</label><input className="input" value={notificationForm.title} onChange={(e) => updateNotificationField('title', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">{t('adminDashboard.notificationActionUrlLabel', 'Action URL')}</label><input className="input" value={notificationForm.action_url} onChange={(e) => updateNotificationField('action_url', e.target.value)} placeholder="/account" /></div>
            </div>
            <div className="form-group mt-4"><label className="form-label">{t('adminDashboard.notificationMessageLabel', 'Notification message')}</label><textarea className="input" rows="4" value={notificationForm.message} onChange={(e) => updateNotificationField('message', e.target.value)} required /></div>
            <div className="form-grid cols-2 mt-4">
              <div className="form-group"><label className="form-label">{t('adminDashboard.recipientLabel', 'Recipient')}</label><select className="input" value={notificationForm.recipient_id} onChange={(e) => updateNotificationField('recipient_id', e.target.value)} disabled={notificationForm.send_to_all}><option value="">{t('adminDashboard.selectClient', 'Select a client')}</option>{clients.map((client) => (<option key={client.id} value={client.id}>{client.full_name || client.username}</option>))}</select></div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '30px' }}><input type="checkbox" checked={notificationForm.send_to_all} onChange={(e) => updateNotificationField('send_to_all', e.target.checked)} /> {t('adminDashboard.sendToAllLabel', 'Send to all clients')}</label>
            </div>
            <div className="row-actions mt-4"><button type="submit" className="btn btn-primary" disabled={sendingNotification}>{sendingNotification ? t('adminDashboard.sendingNotification', 'Sending notification...') : t('adminDashboard.sendNotificationAction', 'Send notification')}</button></div>
          </form>
        </section>
      ) : null}

      {tab === 'inventory' ? (
        <section className="section-block mt-0">
          <div className="section-header"><div><p className="section-label">{t('adminDashboard.inventoryLabel', 'Items')}</p><h2>{items.length} {t('adminDashboard.inventoryCountLabel', 'items')}</h2></div><button type="button" className="btn btn-primary btn-sm" onClick={() => { setEditingId(null); setItemForm(initialItemForm); setTab('new-item'); }}>{t('adminDashboard.newItemAction', 'New item')}</button></div>
          {items.length === 0 ? <EmptyState icon="□" title={t('adminDashboard.noItemsTitle', 'No items yet')} description={t('adminDashboard.noItemsText', 'Add the first item so it appears in the catalogue.')} /> : (
            <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>{t('adminDashboard.imageLabel', 'Image')}</th><th>{t('adminDashboard.nameLabel', 'Name')}</th><th>{t('adminDashboard.categoryLabel', 'Category')}</th><th>{t('adminDashboard.imagesCountLabel', 'Images')}</th><th>{t('adminDashboard.availabilityLabel', 'Availability')}</th><th>{t('adminDashboard.statusLabel', 'Status')}</th><th>{t('adminDashboard.actionLabel', 'Action')}</th></tr></thead><tbody>{items.map((item) => (<tr key={item.id}><td>{item.main_image ? <img src={resolveBackendFileUrl(item.main_image)} alt={item.name} className="mini-product-image" /> : <span className="text-muted text-xs">{t('adminDashboard.noImage', 'None')}</span>}</td><td>{item.name}</td><td>{item.category?.name}</td><td>{item.images_count || 0}</td><td>{item.quantity_available} / {item.quantity_total}</td><td><StatusBadge status={item.status} /></td><td><button type="button" className="btn btn-ghost btn-sm" onClick={() => editItem(item)}>{t('adminDashboard.editAction', 'Edit')}</button></td></tr>))}</tbody></table></div>
          )}
        </section>
      ) : null}

      {tab === 'new-item' ? (
        <section className="section-block mt-0">
          <form className="card" onSubmit={handleCreateCategory} style={{ marginBottom: '16px' }}>
            <h2 style={{ marginBottom: '18px' }}>{t('adminDashboard.newCategoryTitle', 'Add a new category')}</h2>
            <div className="form-grid cols-2">
              <div className="form-group"><label className="form-label">{t('adminDashboard.nameArLabel', 'Arabic name')}</label><input className="input" value={categoryForm.name_ar} onChange={(e) => updateCategoryField('name_ar', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">{t('adminDashboard.nameFrLabel', 'French name')}</label><input className="input" value={categoryForm.name_fr} onChange={(e) => updateCategoryField('name_fr', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">{t('adminDashboard.nameEnLabel', 'English name')}</label><input className="input" value={categoryForm.name_en} onChange={(e) => updateCategoryField('name_en', e.target.value)} required /></div>
            </div>
            <div className="form-grid cols-2 mt-4">
              <div className="form-group"><label className="form-label">{t('adminDashboard.iconLabel', 'Icon')}</label><input className="input" value={categoryForm.icon} onChange={(e) => updateCategoryField('icon', e.target.value)} placeholder="package" /></div>
              <div className="form-group"><label className="form-label">{t('adminDashboard.colorLabel', 'Color')}</label><input className="input" type="color" value={categoryForm.color} onChange={(e) => updateCategoryField('color', e.target.value)} /></div>
            </div>
            <div className="row-actions mt-4"><button type="submit" className="btn btn-primary" disabled={savingCategory}>{savingCategory ? t('adminDashboard.addingCategory', 'Adding category...') : t('adminDashboard.addCategoryAction', 'Add category')}</button></div>
          </form>

          <form className="card" onSubmit={handleSubmitItem}>
            <h2 style={{ marginBottom: '18px' }}>{editingId ? t('adminDashboard.editItemTitle', 'Edit item') : t('adminDashboard.newItemTitle', 'Add new item')}</h2>
            <div className="form-grid cols-2"><div className="form-group"><label className="form-label">{t('adminDashboard.serialNumberLabel', 'Serial number')}</label><input className="input" value={itemForm.serial_number} onChange={(e) => updateFormField('serial_number', e.target.value)} required /></div><div className="form-group"><label className="form-label">{t('adminDashboard.categoryLabel', 'Category')}</label><select className="input" value={itemForm.category_id} onChange={(e) => updateFormField('category_id', e.target.value)} required><option value="">{t('adminDashboard.selectCategory', 'Select a category')}</option>{categories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}</select></div></div>
            <div className="form-grid cols-2 mt-4"><div className="form-group"><label className="form-label">{t('adminDashboard.nameArLabel', 'Arabic name')}</label><input className="input" value={itemForm.name_ar} onChange={(e) => updateFormField('name_ar', e.target.value)} required /></div><div className="form-group"><label className="form-label">{t('adminDashboard.nameFrLabel', 'French name')}</label><input className="input" value={itemForm.name_fr} onChange={(e) => updateFormField('name_fr', e.target.value)} required /></div><div className="form-group"><label className="form-label">{t('adminDashboard.nameEnLabel', 'English name')}</label><input className="input" value={itemForm.name_en} onChange={(e) => updateFormField('name_en', e.target.value)} required /></div></div>
            <div className="form-group mt-4"><label className="form-label">{t('adminDashboard.descriptionArLabel', 'Arabic description')}</label><textarea className="input" rows="4" value={itemForm.description_ar} onChange={(e) => updateFormField('description_ar', e.target.value)} /></div>
            <div className="form-grid cols-3 mt-4"><div className="form-group"><label className="form-label">{t('adminDashboard.totalQuantityLabel', 'Total quantity')}</label><input className="input" type="number" min="1" value={itemForm.quantity_total} onChange={(e) => updateFormField('quantity_total', e.target.value)} required /></div><div className="form-group"><label className="form-label">{t('adminDashboard.availableQuantityLabel', 'Available now')}</label><input className="input" type="number" min="0" value={itemForm.quantity_available} onChange={(e) => updateFormField('quantity_available', e.target.value)} required /></div></div>
            <div className="form-grid cols-3 mt-4"><div className="form-group"><label className="form-label">{t('adminDashboard.statusFieldLabel', 'Status')}</label><select className="input" value={itemForm.status} onChange={(e) => updateFormField('status', e.target.value)}><option value="available">{t('adminDashboard.statusAvailable', 'Available')}</option><option value="reserved">{t('adminDashboard.statusReserved', 'Reserved')}</option><option value="rented">{t('adminDashboard.statusRented', 'Rented')}</option><option value="maintenance">{t('adminDashboard.statusMaintenance', 'Maintenance')}</option></select></div><div className="form-group"><label className="form-label">{t('adminDashboard.conditionFieldLabel', 'Condition')}</label><select className="input" value={itemForm.condition} onChange={(e) => updateFormField('condition', e.target.value)}><option value="excellent">{t('adminDashboard.conditionExcellent', 'Excellent')}</option><option value="good">{t('adminDashboard.conditionGood', 'Good')}</option><option value="fair">{t('adminDashboard.conditionFair', 'Fair')}</option><option value="damaged">{t('adminDashboard.conditionDamaged', 'Damaged')}</option></select></div></div>
            <div className="form-grid cols-2 mt-4"><div className="form-group"><label className="form-label">{t('adminDashboard.storageLocationLabel', 'Storage location')}</label><input className="input" value={itemForm.storage_location} onChange={(e) => updateFormField('storage_location', e.target.value)} required /></div><label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '30px' }}><input type="checkbox" checked={itemForm.is_featured} onChange={(e) => updateFormField('is_featured', e.target.checked)} /> {t('adminDashboard.featuredItemLabel', 'Featured item')}</label></div>
            <div className="row-actions mt-4"><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('adminDashboard.saving', 'Saving...') : editingId ? t('adminDashboard.saveChangesAction', 'Save changes') : t('adminDashboard.addItemAction', 'Add item')}</button>{editingId ? <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setItemForm(initialItemForm); }}>{t('adminDashboard.cancelEditAction', 'Cancel edit')}</button> : null}</div>
            {editingId ? <div className="card mt-4" style={{ borderStyle: 'dashed' }}><h3 style={{ marginBottom: '12px' }}>{t('adminDashboard.uploadProductImagesTitle', 'Upload item images')}</h3><p className="text-muted text-sm" style={{ marginBottom: '10px' }}>{t('adminDashboard.uploadProductImagesText', 'After saving the item, you can upload a main image or additional gallery images.')}</p><div className="form-grid cols-2"><input className="input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /><label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '10px' }}><input type="checkbox" checked={imageIsMain} onChange={(e) => setImageIsMain(e.target.checked)} /> {t('adminDashboard.mainImageLabel', 'Set as main image')}</label></div><div className="row-actions mt-2"><button type="button" className="btn btn-primary btn-sm" onClick={handleImageUpload} disabled={uploadingImage || !imageFile}>{uploadingImage ? t('adminDashboard.uploadingImage', 'Uploading image...') : t('adminDashboard.uploadImageAction', 'Upload image')}</button></div></div> : null}
          </form>
        </section>
      ) : null}
    </>
  );
}
