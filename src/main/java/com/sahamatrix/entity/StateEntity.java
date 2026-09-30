package com.sahamatrix.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "states")
public class StateEntity {

    @Id
    @Column(length = 5)
    private String code; // 'MH', 'UP', 'TN'

    @Column(nullable = false, length = 50)
    private String name;

    public StateEntity() {}

    public StateEntity(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
