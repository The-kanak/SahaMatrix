package com.sahamatrix.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "medicines")
public class MedicineEntity {

    @Id
    @Column(length = 50)
    private String id; // 'paracetamol'

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String unit;

    public MedicineEntity() {}

    public MedicineEntity(String id, String name, String unit) {
        this.id = id;
        this.name = name;
        this.unit = unit;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }
}
