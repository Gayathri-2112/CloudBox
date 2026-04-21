import { useState, useEffect, useCallback } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/style.css";
import "../styles/CloudProviders.css";

const PROVIDERS = [
    {
        key: "MINIO",
        name: "MinIO",
        icon: "fa-solid fa-server",
        color: "#cf163d",
        description: "Self-hosted S3-compatible storage",
        fields: [
            { key: "endpoint", label: "Endpoint", placeholder: "http://localhost:9000", type: "text", required: true, hint: "Include protocol and port. Example: http://localhost:9000" },
            { key: "accessKey", label: "Access key", placeholder: "minioadmin", type: "text", required: true },
            { key: "secretKey", label: "Secret key", placeholder: "minioadmin", type: "password", required: true },
            { key: "bucket", label: "Bucket", placeholder: "my-bucket", type: "text", required: true },
            { key: "region", label: "Region", placeholder: "us-east-1", type: "text", required: false, hint: "Optional. Defaults to us-east-1 for S3-compatible endpoints." },
        ]
    },
    {
        key: "AWS_S3",
        name: "Amazon S3",
        icon: "fab fa-aws",
        color: "#ff9900",
        description: "AWS Simple Storage Service",
        fields: [
            { key: "accessKey", label: "Access key ID", placeholder: "AKIA...", type: "text", required: true },
            { key: "secretKey", label: "Secret access key", placeholder: "••••••••••", type: "password", required: true },
            { key: "bucket", label: "Bucket", placeholder: "my-bucket", type: "text", required: true },
            { key: "region", label: "Region", placeholder: "us-east-1", type: "text", required: true },
        ]
    },
    {
        key: "AZURE_BLOB",
        name: "Azure Blob Storage",
        icon: "fab fa-microsoft",
        color: "#007FFF",
        description: "Microsoft Azure Blob Storage",
        fields: [
            { key: "connectionString", label: "Connection string", placeholder: "DefaultEndpointsProtocol=...", type: "password", required: false, hint: "Recommended. If provided, account name/key below are optional." },
            { key: "accountName", label: "Account name", placeholder: "myaccount", type: "text", required: false, hint: "Use with account key if you don't have a connection string." },
            { key: "accountKey", label: "Account key", placeholder: "••••••••••", type: "password", required: false },
            { key: "containerName", label: "Container", placeholder: "my-container", type: "text", required: true },
        ]
    },
    {
        key: "GCS",
        name: "Google Cloud Storage",
        icon: "fab fa-google",
        color: "#4285F4",
        description: "Google Cloud Platform Storage",
        fields: [
            { key: "projectId", label: "Project ID", placeholder: "my-project-123", type: "text", required: true },
            { key: "jsonKeyPath", label: "Service account JSON path", placeholder: "/absolute/path/to/key.json", type: "text", required: true },
            { key: "bucket", label: "Bucket", placeholder: "my-bucket", type: "text", required: true },
        ]
    },
    {
        key: "LOCAL",
        name: "Local Storage",
        icon: "fa-solid fa-folder",
        color: "#161b22",
        description: "Local filesystem storage (fallback)",
        fields: [
            { key: "uploadDir", label: "Upload directory", placeholder: "uploads/", type: "text", required: true, hint: "Server-side path. Keep it within the backend project for safety." },
        ]
    }
];

function CloudProviders() {
    const { messages, removeToast, toast } = useToast();
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testingConnection, setTestingConnection] = useState(null);
    const [savingProvider, setSavingProvider] = useState(null);
    const [formData, setFormData] = useState({});
    const [activeForm, setActiveForm] = useState(null);
    const [testResults, setTestResults] = useState({});
    const [saveAsDefault, setSaveAsDefault] = useState({});

    const fetchProviders = useCallback(async () => {
        try {
            const res = await API.get("/cloud-providers");
            setProviders(res.data || []);
        } catch (err) {
            console.error("Failed to fetch providers:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    const handleInputChange = (providerKey, fieldKey, value) => {
        setFormData(prev => ({
            ...prev,
            [`${providerKey}_${fieldKey}`]: value
        }));
    };

    const getFormValue = (providerKey, fieldKey) => {
        return formData[`${providerKey}_${fieldKey}`] || "";
    };

    const buildRequest = (providerKey) => {
        const providerConfig = PROVIDERS.find(p => p.key === providerKey);
        const fields = providerConfig?.fields || [];

        const request = {
            providerType: providerKey,
            providerName: providerConfig?.name
        };

        fields.forEach(field => {
            request[field.key] = getFormValue(providerKey, field.key);
        });

        return { request, providerConfig, fields };
    };

    const validate = (providerKey) => {
        const { request, fields } = buildRequest(providerKey);

        for (const f of fields) {
            if (f.required && !String(request[f.key] || "").trim()) {
                return { ok: false, message: `Please fill: ${f.label}` };
            }
        }

        if (providerKey === "AZURE_BLOB") {
            const hasConn = String(request.connectionString || "").trim().length > 0;
            const hasAccountPair = String(request.accountName || "").trim().length > 0
                && String(request.accountKey || "").trim().length > 0;
            if (!hasConn && !hasAccountPair) {
                return { ok: false, message: "Azure requires a connection string or an account name + account key." };
            }
        }

        return { ok: true, message: "" };
    };

    const testConnection = async (providerKey) => {
        const v = validate(providerKey);
        if (!v.ok) {
            toast.error(v.message);
            setTestResults(prev => ({
                ...prev,
                [providerKey]: { status: "fail", message: v.message, at: Date.now() }
            }));
            return;
        }

        setTestingConnection(providerKey);
        try {
            const { request } = buildRequest(providerKey);

            const res = await API.post("/cloud-providers/test-connection", request);
            const success = !!res.data?.success;
            const msg = res.data?.message || (success ? "Connection successful!" : "Connection failed");
            setTestResults(prev => ({
                ...prev,
                [providerKey]: { status: success ? "success" : "fail", message: msg, at: Date.now() }
            }));
            toast.success(res.data.message || "Connection successful!");
        } catch (err) {
            const msg = err.response?.data?.message || "Connection failed";
            setTestResults(prev => ({
                ...prev,
                [providerKey]: { status: "fail", message: msg, at: Date.now() }
            }));
            toast.error(err.response?.data?.message || "Connection failed");
        } finally {
            setTestingConnection(null);
        }
    };

    const saveProvider = async (providerKey) => {
        const v = validate(providerKey);
        if (!v.ok) {
            toast.error(v.message);
            return;
        }

        setSavingProvider(providerKey);
        try {
            const { request, providerConfig, fields } = buildRequest(providerKey);
            request.setAsDefault = !!saveAsDefault[providerKey];

            await API.post("/cloud-providers", request);
            toast.success(`${providerConfig?.name} saved successfully!`);
            fetchProviders();
            setActiveForm(null);
            setTestResults(prev => {
                const next = { ...prev };
                delete next[providerKey];
                return next;
            });
            setSaveAsDefault(prev => ({ ...prev, [providerKey]: false }));
            setFormData(prev => {
                const newData = { ...prev };
                fields.forEach(field => {
                    delete newData[`${providerKey}_${field.key}`];
                });
                return newData;
            });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save provider");
        } finally {
            setSavingProvider(null);
        }
    };

    const [confirmDelete, setConfirmDelete] = useState(null);

    const deleteProvider = async (providerId, providerName) => {
        if (confirmDelete === providerId) {
            // User confirmed, proceed with deletion
            try {
                await API.delete(`/cloud-providers/${providerId}`);
                toast.success("Provider removed successfully");
                fetchProviders();
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to remove provider");
            }
            setConfirmDelete(null);
        } else {
            // First click - show confirmation
            setConfirmDelete(providerId);
            toast.warning(`Click again to confirm removal of ${providerName}`);
            // Auto-reset after 3 seconds
            setTimeout(() => setConfirmDelete(null), 3000);
        }
    };

    const setAsDefault = async (providerId) => {
        try {
            await API.put(`/cloud-providers/${providerId}`, { setAsDefault: true });
            toast.success("Default provider updated");
            fetchProviders();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to set default");
        }
    };

    const isProviderConfigured = (providerKey) => {
        return providers.some(p => p.providerType === providerKey);
    };

    const getConfiguredProvider = (providerKey) => {
        return providers.find(p => p.providerType === providerKey) || null;
    };

    const canSave = (providerKey) => {
        const v = validate(providerKey);
        if (!v.ok) return false;
        return testResults[providerKey]?.status === "success";
    };

    if (loading) {
        return (
            <Layout type="user">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading cloud providers...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout type="user">
            <div className="cp-page">
                <div className="cp-header">
                    <div className="cp-title-row">
                        <div>
                            <h1><i className="fa-solid fa-cloud"></i> Cloud Storage Providers</h1>
                            <p>Connect providers, test credentials, and choose a default for uploads.</p>
                        </div>
                        <button className="btn btn-sm btn-outline" onClick={fetchProviders} type="button">
                            <i className="fa-solid fa-rotate"></i> Refresh
                        </button>
                    </div>
                </div>

                {/* Configured Providers */}
                {providers.length > 0 && (
                    <div className="cp-section">
                        <h2><i className="fa-solid fa-check-circle"></i> Configured Providers</h2>
                        <div className="cp-provider-grid">
                            {providers.map(provider => {
                                const providerInfo = PROVIDERS.find(p => p.key === provider.providerType) || {};
                                return (
                                    <div key={provider.id} className="cp-provider-card configured">
                                        <div className="cp-card-header" style={{ background: providerInfo.color || '#6366f1' }}>
                                            <i className={`${providerInfo.icon || 'fa-cloud'}`}></i>
                                            <span>{provider.providerName}</span>
                                            {provider.isDefault && <span className="cp-default-badge">Default</span>}
                                        </div>
                                        <div className="cp-card-body">
                                            <p className="cp-status">
                                                <i className={`fa-solid ${provider.connected ? 'fa-check' : 'fa-times'}`}></i>
                                                {provider.connected ? 'Connected' : 'Disconnected'}
                                            </p>
                                            <p className="cp-added">Added: {new Date(provider.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="cp-card-actions">
                                            {!provider.isDefault && (
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => setAsDefault(provider.id)}
                                                    type="button"
                                                >
                                                    <i className="fa-solid fa-star"></i> Set Default
                                                </button>
                                            )}
                                            <button
                                                className={`btn btn-sm ${confirmDelete === provider.id ? 'btn-danger' : 'btn-outline'}`}
                                                onClick={() => deleteProvider(provider.id, provider.providerName)}
                                                type="button"
                                            >
                                                <i className="fa-solid fa-trash"></i> {confirmDelete === provider.id ? 'Confirm?' : 'Remove'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Available Providers */}
                <div className="cp-section">
                    <h2><i className="fa-solid fa-plus-circle"></i> Add New Provider</h2>
                    <div className="cp-provider-grid">
                        {PROVIDERS.map(provider => {
                            const isConfigured = isProviderConfigured(provider.key);
                            const isActive = activeForm === provider.key;
                            const configured = getConfiguredProvider(provider.key);
                            const result = testResults[provider.key];

                            return (
                                <div key={provider.key} className={`cp-provider-card ${isConfigured ? 'configured' : ''}`}>
                                    <div className="cp-card-header" style={{ background: provider.color }}>
                                        <i className={`${provider.icon}`}></i>
                                        <span>{provider.name}</span>
                                        {configured?.isDefault && <span className="cp-default-badge">Default</span>}
                                    </div>
                                    <div className="cp-card-body">
                                        <p className="cp-description">{provider.description}</p>
                                        {isConfigured && (
                                            <p className="cp-configured-badge">
                                                <i className="fa-solid fa-check"></i> Configured
                                            </p>
                                        )}
                                        {!isConfigured && result?.status && (
                                            <div className={`cp-test-pill ${result.status === "success" ? "ok" : "bad"}`}>
                                                <i className={`fa-solid ${result.status === "success" ? "fa-check" : "fa-triangle-exclamation"}`}></i>
                                                <span>{result.message}</span>
                                            </div>
                                        )}
                                    </div>

                                    {!isConfigured && (
                                        <div className="cp-card-actions">
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => setActiveForm(isActive ? null : provider.key)}
                                                type="button"
                                            >
                                                <i className={`fa-solid ${isActive ? 'fa-times' : 'fa-plus'}`}></i>
                                                {isActive ? 'Cancel' : 'Configure'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Configuration Form */}
                                    {isActive && !isConfigured && (
                                        <div className="cp-config-form">
                                            <div className="cp-form-grid">
                                                {provider.fields.map(field => (
                                                    <div key={field.key} className="cp-form-group">
                                                        <label htmlFor={`cp_${provider.key}_${field.key}`}>
                                                            {field.label}
                                                            {field.required && <span className="cp-required" aria-hidden="true">*</span>}
                                                        </label>
                                                        <input
                                                            id={`cp_${provider.key}_${field.key}`}
                                                            type={field.type}
                                                            className="cp-input"
                                                            placeholder={field.placeholder}
                                                            value={getFormValue(provider.key, field.key)}
                                                            onChange={(e) => handleInputChange(provider.key, field.key, e.target.value)}
                                                            autoComplete="off"
                                                            spellCheck={false}
                                                        />
                                                        {field.hint && <div className="cp-hint">{field.hint}</div>}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="cp-form-row">
                                                <label className="cp-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!saveAsDefault[provider.key]}
                                                        onChange={(e) => setSaveAsDefault(prev => ({ ...prev, [provider.key]: e.target.checked }))}
                                                    />
                                                    <span>Set as default for uploads</span>
                                                </label>
                                                <div className="cp-form-note">Test connection, then save.</div>
                                            </div>
                                            <div className="cp-form-actions">
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    disabled={testingConnection === provider.key}
                                                    onClick={() => testConnection(provider.key)}
                                                    type="button"
                                                >
                                                    {testingConnection === provider.key ? (
                                                        <><i className="fa-solid fa-spinner fa-spin"></i> Testing...</>
                                                    ) : (
                                                        <><i className="fa-solid fa-plug"></i> Test Connection</>
                                                    )}
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    disabled={savingProvider === provider.key || !canSave(provider.key)}
                                                    onClick={() => saveProvider(provider.key)}
                                                    type="button"
                                                    title={!canSave(provider.key) ? "Run a successful connection test before saving." : "Save provider"}
                                                >
                                                    {savingProvider === provider.key ? (
                                                        <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
                                                    ) : (
                                                        <><i className="fa-solid fa-save"></i> Save</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Connection Status Info */}
                <div className="cp-section cp-info">
                    <h3><i className="fa-solid fa-info-circle"></i> About Multi-Cloud Storage</h3>
                    <ul>
                        <li>You can configure multiple cloud storage providers and switch between them</li>
                        <li>Files uploaded will be stored in the default provider unless specified otherwise</li>
                        <li>MinIO is the default provider - configure it first for local S3-compatible storage</li>
                        <li>AWS S3, Azure Blob, and Google Cloud Storage require valid credentials</li>
                        <li>Local storage serves as a fallback when cloud storage is unavailable</li>
                    </ul>
                </div>
            </div>

            <Toast messages={messages} removeToast={removeToast} />
        </Layout>
    );
}

export default CloudProviders;