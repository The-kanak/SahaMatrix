package com.sahamatrix.repository;

import com.sahamatrix.entity.PhcEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhcRepository extends JpaRepository<PhcEntity, String> {
    List<PhcEntity> findByState(String state);
}
