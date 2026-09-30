package com.sahamatrix.repository;

import com.sahamatrix.entity.PhcStockEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhcStockRepository extends JpaRepository<PhcStockEntity, Long> {
    List<PhcStockEntity> findByPhcId(String phcId);
    Optional<PhcStockEntity> findByPhcIdAndMedicine(String phcId, String medicine);
}
