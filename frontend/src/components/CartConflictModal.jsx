import React from 'react'

export default function CartConflictModal({ isOpen, onClose, onConfirmClearAndAdd, existingRestaurant, newRestaurant, itemToAdd }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card cart-conflict-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="warning-icon">⚠️</div>
        <h3>Items Already in Cart</h3>
        
        <p className="conflict-message">
          Your cart currently contains items from <strong>{existingRestaurant || 'another restaurant'}</strong>.
        </p>
        <p className="conflict-submessage">
          Adding <strong>{itemToAdd?.name || 'this item'}</strong> from <strong>{newRestaurant || 'a different restaurant'}</strong> will clear your current cart.
        </p>

        <div className="conflict-actions">
          <button className="secondary-btn cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn danger-btn" onClick={() => onConfirmClearAndAdd(itemToAdd)}>
            Clear Cart & Add
          </button>
        </div>
      </div>
    </div>
  )
}
