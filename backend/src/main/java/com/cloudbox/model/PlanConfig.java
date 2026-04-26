package com.cloudbox.model;

import jakarta.persistence.*;

@Entity
@Table(name = "plan_configs")
public class PlanConfig {

    @Id
    @Enumerated(EnumType.STRING)
    private Plan plan;

    private Long pricePaise;      // price in paise
    private Long storageMb;       // storage in MB
    private String displayName;
    private String description;   // comma-separated features

    public Plan getPlan() { return plan; }
    public void setPlan(Plan plan) { this.plan = plan; }

    public Long getPricePaise() { return pricePaise; }
    public void setPricePaise(Long pricePaise) { this.pricePaise = pricePaise; }

    public Long getStorageMb() { return storageMb; }
    public void setStorageMb(Long storageMb) { this.storageMb = storageMb; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
