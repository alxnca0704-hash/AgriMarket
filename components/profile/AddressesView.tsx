'use client';

import React from 'react';
import { Alert, Button, Empty, Skeleton } from 'antd';
import { EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import { useAddresses } from '@/hooks/useAddresses';
import { AddressFormModal } from '@/components/profile/AddressFormModal';
import { AddressCard } from '@/components/profile/AddressCard';

export function AddressesView() {
  const { isLoading, error, addressBook } = useAddresses();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-10 pb-16 space-y-5 sm:space-y-6">
      <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-stone-900">
        Saved addresses
        <span className="text-stone-400 font-normal text-lg sm:text-xl">
          {' '}
          ({addressBook.addresses.length})
        </span>
      </h1>

      {error && <Alert type="error" title={error} showIcon />}

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl bg-white shadow-sm p-5">
              <Skeleton active paragraph={{ rows: 3 }} title={{ width: '40%' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-stone-400 flex items-center gap-1.5">
              <EnvironmentOutlined className="text-sage" />
              The default address is pre-selected at checkout.
            </p>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addressBook.openAdd}
              className="!rounded-xl shrink-0"
            >
              Add address
            </Button>
          </div>

          {addressBook.addresses.length === 0 ? (
            <div className="rounded-2xl bg-white shadow-sm py-14">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="space-y-1.5">
                    <p className="text-stone-800 font-medium">No saved addresses</p>
                    <p className="text-sm text-stone-400">
                      Save your home or farm address for faster checkout.
                    </p>
                  </div>
                }
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addressBook.openAdd}
                  className="!rounded-xl"
                >
                  Add an address
                </Button>
              </Empty>
            </div>
          ) : (
            <div className="space-y-3">
              {addressBook.addresses.map((address, index) => (
                <AddressCard
                  key={`${index}-${address.region}-${address.streetBuilding}`}
                  address={address}
                  isDefault={index === addressBook.defaultIndex}
                  onEdit={() => addressBook.openEdit(index)}
                  onSetDefault={() => addressBook.setDefaultAddress(index)}
                  onRemove={() => addressBook.removeAddress(index)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AddressFormModal
        open={addressBook.editorOpen}
        title={addressBook.editorTitle}
        submitLabel={addressBook.submitLabel}
        editor={addressBook.editor}
        onSave={addressBook.saveAddress}
        onCancel={addressBook.closeEditor}
      />
    </div>
  );
}