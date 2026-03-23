package com.cloudbox.dto;

public class AdminSettingsRequest {

    private Long storageLimit;
    private boolean allowSignup;

    public Long getStorageLimit() {
        return storageLimit;
    }

    public void setStorageLimit(Long storageLimit) {
        this.storageLimit = storageLimit;
    }

    public boolean isAllowSignup() {
        return allowSignup;
    }

    public void setAllowSignup(boolean allowSignup) {
        this.allowSignup = allowSignup;
    }
}
