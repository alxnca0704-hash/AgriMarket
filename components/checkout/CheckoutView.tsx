'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Empty, Skeleton } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useCheckout } from '@/hooks/useCheckout';
import { DeliveryDetailsPanel } from '@/components/checkout/DeliveryDetailsPanel';
import { CheckoutSellerCard } from '@/components/checkout/CheckoutSellerCard';
import { PaymentMethodCard } from '@/components/checkout/PaymentMethodCard';
import { PlaceOrderBar } from '@/components/checkout/PlaceOrderBar';
import { ConfirmOrderModal } from '@/components/checkout/ConfirmOrderModal';
import { OrderSuccess } from '@/components/checkout/OrderSuccess';
import { APP_ROUTES } from '@/constants/routes';

function CheckoutSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6">
      <Skeleton.Button active className="!w-48 !h-8 !rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Skeleton active paragraph={{ rows: 5 }} title={{ width: '40%' }} />
          <Skeleton active paragraph={{ rows: 6 }} title={{ width: '30%' }} />
        </div>
        <div className="hidden lg:block lg:col-span-4">
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: '50%' }} />
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { key: 1, label: 'Delivery details' },
  { key: 2, label: 'Review & place order' },
];

function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((step, index) => {
        const complete = step.key < current;
        const active = step.key === current;
        return (
          <React.Fragment key={step.key}>
            {index > 0 && (
              <span className={`h-px w-4 sm:w-8 ${complete || active ? 'bg-sage' : 'bg-stone-200'}`} />
            )}
            <li className="flex items-center gap-1.5">
              <span
                className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                  complete
                    ? 'bg-[#2D6A4F] text-white'
                    : active
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {complete ? <CheckOutlined className="text-xs" /> : step.key}
              </span>
              <span
                className={`text-xs sm:text-sm font-medium ${
                  active ? 'text-stone-900' : complete ? 'text-sage' : 'text-stone-400'
                }`}
              >
                {step.label}
              </span>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const {
    isLoading,
    groups,
    subtotal,
    deliveryFee,
    total,
    itemCount,
    editMode,
    isAdding,
    detailsConfirmed,
    addresses,
    selectedIndex,
    defaultIndex,
    selectedAddress,
    addressKey,
    draftAddress,
    errors,
    notes,
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    isProvincesLoading,
    isCitiesLoading,
    isBarangaysLoading,
    confirmOpen,
    isPlacing,
    placedOrders,
    updateDraftField,
    handleSelectRegion,
    handleSelectProvince,
    handleSelectCity,
    selectAddress,
    setDefaultAddress,
    startEdit,
    startAdd,
    saveDeliveryDetails,
    cancelEdit,
    updateNote,
    openConfirm,
    closeConfirm,
    placeOrder,
  } = useCheckout();

  if (isLoading) {
    return <CheckoutSkeleton />;
  }

  if (placedOrders) {
    return (
      <OrderSuccess
        orders={placedOrders}
        onTrackOrders={() => router.push(APP_ROUTES.orders)}
        onContinueShopping={() => router.push(APP_ROUTES.home)}
      />
    );
  }

  if (itemCount === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="space-y-1.5">
              <p className="text-stone-800 font-medium">Nothing to check out</p>
              <p className="text-sm text-stone-400">
                Your cart is empty. Add farm-fresh produce first, then return here.
              </p>
            </div>
          }
        >
          <Button
            type="primary"
            size="large"
            onClick={() => router.push(APP_ROUTES.home)}
            className="!rounded-xl"
          >
            Browse products
          </Button>
        </Empty>
      </div>
    );
  }

  const currentStep = detailsConfirmed && !editMode ? 2 : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-32 lg:pb-16">
      <div className="flex items-center justify-between gap-3 mb-6">
        <CheckoutSteps current={currentStep} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8 space-y-5">
          <DeliveryDetailsPanel
            editMode={editMode}
            isAdding={isAdding}
            confirmed={detailsConfirmed}
            addresses={addresses}
            selectedIndex={selectedIndex}
            defaultIndex={defaultIndex}
            addressKey={addressKey}
            draftAddress={draftAddress}
            errors={errors}
            regionOptions={regionOptions}
            provinceOptions={provinceOptions}
            cityOptions={cityOptions}
            barangayOptions={barangayOptions}
            isProvincesLoading={isProvincesLoading}
            isCitiesLoading={isCitiesLoading}
            isBarangaysLoading={isBarangaysLoading}
            onUpdate={updateDraftField}
            onSelectRegion={handleSelectRegion}
            onSelectProvince={handleSelectProvince}
            onSelectCity={handleSelectCity}
            onSelectAddress={selectAddress}
            onSetDefault={setDefaultAddress}
            onStartEdit={startEdit}
            onStartAdd={startAdd}
            onSave={saveDeliveryDetails}
            onCancel={cancelEdit}
          />

          {groups.map((group) => (
            <CheckoutSellerCard
              key={group.seller.id}
              seller={group.seller}
              lines={group.lines}
              subtotal={group.subtotal}
              note={notes[group.seller.id] ?? ''}
              onNoteChange={(value) => updateNote(group.seller.id, value)}
            />
          ))}

          <PaymentMethodCard total={total} />
        </div>

        <div className="lg:col-span-4">
          <PlaceOrderBar
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            itemCount={itemCount}
            disabled={!detailsConfirmed || editMode}
            onPlaceOrder={openConfirm}
          />
        </div>
      </div>

      <ConfirmOrderModal
        open={confirmOpen}
        isPlacing={isPlacing}
        address={selectedAddress}
        isDefault={selectedAddress != null && selectedIndex === defaultIndex}
        total={total}
        itemCount={itemCount}
        onClose={closeConfirm}
        onConfirm={placeOrder}
      />
    </div>
  );
}