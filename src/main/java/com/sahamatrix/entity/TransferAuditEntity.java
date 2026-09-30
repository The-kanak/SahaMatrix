package com.sahamatrix.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "transfer_audit")
public class TransferAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transfer_id", nullable = false, length = 100)
    private String transferId;

    @Column(nullable = false, length = 50)
    private String medicine;

    @Column(nullable = false)
    private Double quantity;

    @Column(name = "from_phc_id", nullable = false, length = 30)
    private String fromPhcId;

    @Column(name = "to_phc_id", nullable = false, length = 30)
    private String toPhcId;

    @Column(name = "distance_km")
    private Double distanceKm;

    @Column(name = "cross_state")
    private Boolean crossState;

    @Column(name = "applied_at", length = 30)
    private String appliedAt;

    public TransferAuditEntity() {}

    public TransferAuditEntity(String transferId, String medicine, Double quantity,
                               String fromPhcId, String toPhcId, Double distanceKm,
                               Boolean crossState, String appliedAt) {
        this.transferId = transferId;
        this.medicine = medicine;
        this.quantity = quantity;
        this.fromPhcId = fromPhcId;
        this.toPhcId = toPhcId;
        this.distanceKm = distanceKm;
        this.crossState = crossState;
        this.appliedAt = appliedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTransferId() {
        return transferId;
    }

    public void setTransferId(String transferId) {
        this.transferId = transferId;
    }

    public String getMedicine() {
        return medicine;
    }

    public void setMedicine(String medicine) {
        this.medicine = medicine;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getFromPhcId() {
        return fromPhcId;
    }

    public void setFromPhcId(String fromPhcId) {
        this.fromPhcId = fromPhcId;
    }

    public String getToPhcId() {
        return toPhcId;
    }

    public void setToPhcId(String toPhcId) {
        this.toPhcId = toPhcId;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Boolean getCrossState() {
        return crossState;
    }

    public void setCrossState(Boolean crossState) {
        this.crossState = crossState;
    }

    public String getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(String appliedAt) {
        this.appliedAt = appliedAt;
    }
}
