package com.sahamatrix.repository;

import com.sahamatrix.entity.TransferAuditEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransferAuditRepository extends JpaRepository<TransferAuditEntity, Long> {
    List<TransferAuditEntity> findAllByOrderByAppliedAtDesc();
}
