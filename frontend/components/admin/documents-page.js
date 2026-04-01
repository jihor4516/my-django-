'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/i18n/language-provider';
import EmptyState from '@/components/ui/empty-state';
import StatusBadge from '@/components/ui/status-badge';
import { createDocument, getDocuments, getStaffClients, getStaffItems, resolveBackendFileUrl } from '@/lib/client-api';
import { documentTypes } from '@/data/site';
import { formatDate } from '@/lib/format';

const initialForm = {
  doc_type: 'decharge',
  client_user_id: '',
  purpose: '',
  items: [{ item_id: '', quantity: 1, notes: '' }],
};

export default function DocumentsPage() {
  const { t, lang } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedClient = clients.find((client) => String(client.id) === String(form.client_user_id)) || null;
  const localizedDocumentTypes = documentTypes.map((type) => ({
    value: type.value,
    label: t(`documentTypes.${type.value}`, type.label),
  }));

  async function loadPage() {
    const [documentsResponse, itemsResponse, clientsResponse] = await Promise.all([getDocuments(), getStaffItems(), getStaffClients()]);
    setDocuments(documentsResponse.results || []);
    setItems(itemsResponse.results || []);
    setClients(clientsResponse.results || []);
  }

  useEffect(() => {
    loadPage()
      .catch((requestError) => {
        if (requestError.status === 401 || requestError.status === 403) {
          window.location.href = '/login?next=/admin/documents';
          return;
        }
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateItemRow(index, key, value) {
    setForm((current) => ({
      ...current,
      items: current.items.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    }));
  }

  function addItemRow() {
    setForm((current) => ({ ...current, items: [...current.items, { item_id: '', quantity: 1, notes: '' }] }));
  }

  function removeItemRow(index) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, rowIndex) => rowIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        doc_type: form.doc_type,
        client_user_id: Number(form.client_user_id),
        purpose: form.purpose,
        items: form.items
          .filter((row) => row.item_id && Number(row.quantity) > 0)
          .map((row) => ({ item_id: Number(row.item_id), quantity: Number(row.quantity), notes: row.notes })),
      };
      await createDocument(payload);
      setMessage(t('adminDocuments.createSuccess', 'Document created successfully.'));
      setForm(initialForm);
      await loadPage();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner" /><span>{t('adminDocuments.loading', 'Loading documents...')}</span></div>;
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">admin</p>
        <h1>{t('adminDocuments.title', 'Internal staff documents')}</h1>
        <p className="text-muted">{t('adminDocuments.subtitle', 'Create operational documents from client accounts and selected products.')}</p>
      </section>

      <section className="section-block">
        <div className="grid grid-2">
          <form className="card" onSubmit={handleSubmit}>
            <h2 style={{ marginBottom: '18px' }}>{t('adminDocuments.createTitle', 'Create a new document')}</h2>
            <div className="form-group">
              <label className="form-label">{t('adminDocuments.documentType', 'Document type')}</label>
              <select className="input" value={form.doc_type} onChange={(e) => updateField('doc_type', e.target.value)}>
                {localizedDocumentTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('adminDocuments.clientField', 'Client account')}</label>
              <select className="input" value={form.client_user_id} onChange={(e) => updateField('client_user_id', e.target.value)} required>
                <option value="">{t('adminDocuments.selectClient', 'Select a client')}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.full_name} ({client.username})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('adminDocuments.clientInfo', 'Client info')}</label>
              <input
                className="input"
                value={selectedClient ? `${selectedClient.phone || selectedClient.email || selectedClient.username}${selectedClient.city ? ` - ${selectedClient.city}` : ''}` : ''}
                readOnly
                placeholder={t('adminDocuments.clientInfoPlaceholder', 'Loaded automatically from the selected account')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('adminDocuments.purpose', 'Purpose')}</label>
              <textarea className="input" rows="3" value={form.purpose} onChange={(e) => updateField('purpose', e.target.value)} required />
            </div>

            <div className="stack-list compact mt-4">
              {form.items.map((row, index) => (
                <div key={`${index}-${row.item_id}`} className="card" style={{ padding: '14px' }}>
                  <div className="form-grid cols-2">
                    <div className="form-group">
                      <label className="form-label">{t('adminDocuments.item', 'Item')}</label>
                      <select className="input" value={row.item_id} onChange={(e) => updateItemRow(index, 'item_id', e.target.value)}>
                        <option value="">{t('adminDocuments.selectItem', 'Select an item')}</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('adminDocuments.quantity', 'Quantity')}</label>
                      <input className="input" type="number" min="1" value={row.quantity} onChange={(e) => updateItemRow(index, 'quantity', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group mt-2">
                    <label className="form-label">{t('adminDocuments.rowNotes', 'Row notes')}</label>
                    <input className="input" value={row.notes} onChange={(e) => updateItemRow(index, 'notes', e.target.value)} />
                  </div>
                  {form.items.length > 1 ? <button type="button" className="btn btn-danger btn-sm mt-2" onClick={() => removeItemRow(index)}>{t('adminDocuments.removeRow', 'Remove row')}</button> : null}
                </div>
              ))}
            </div>

            <div className="row-actions mt-4">
              <button type="button" className="btn btn-ghost" onClick={addItemRow}>{t('adminDocuments.addItem', 'Add item')}</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('adminDocuments.saving', 'Saving...') : t('adminDocuments.createAction', 'Create document')}</button>
            </div>
            {message ? <div className="alert alert-ok mt-4">{message}</div> : null}
            {error ? <div className="alert alert-danger mt-4">{error}</div> : null}
          </form>

          <div className="card">
            <h2 style={{ marginBottom: '18px' }}>{t('adminDocuments.latestTitle', 'Latest documents')}</h2>
            {documents.length === 0 ? (
              <EmptyState icon="□" title={t('adminDocuments.emptyTitle', 'No documents yet')} description={t('adminDocuments.emptyText', 'Create the first operational document from the adjacent form.')} />
            ) : (
              <div className="stack-list compact">
                {documents.map((document) => (
                  <div key={document.id} className="row-line">
                    <div>
                      <strong>{document.doc_number}</strong>
                      <p className="text-muted text-sm">{document.external_name} · {formatDate(document.created_at, lang)} · {document.doc_type_label || document.doc_type}</p>
                      <div className="row-actions" style={{ marginTop: '10px' }}>
                        {document.document_preview_url ? <a className="btn btn-primary btn-sm" href={resolveBackendFileUrl(document.document_preview_url)} target="_blank" rel="noreferrer">{t('adminDocuments.previewAction', 'Preview document')}</a> : null}
                        {document.document_preview_url ? <a className="btn btn-ok btn-sm" href={resolveBackendFileUrl(`${document.document_preview_url}?print=1`)} target="_blank" rel="noreferrer">{t('adminDocuments.printAction', 'Print document')}</a> : null}
                        {document.document_pdf_url ? <a className="btn btn-ghost btn-sm" href={resolveBackendFileUrl(document.document_pdf_url)} target="_blank" rel="noreferrer">{t('adminDocuments.downloadPdfAction', 'Download PDF')}</a> : null}
                      </div>
                    </div>
                    <StatusBadge status={document.status} label={document.doc_type} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
