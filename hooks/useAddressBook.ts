'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { App } from 'antd';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DeliveryAddress } from '@/types/auth';
import {
  DEMO_BUYER,
  getDefaultAddressIndex,
  getDeliveryAddresses,
  getSessionUserSnapshot,
  persistUserAddresses,
  subscribeSessionUser,
} from '@/lib/mockSession';
import { formatAddressSummary } from '@/lib/format';
import { toDeliveryAddress } from '@/lib/convexSync';
import { useConvexUserSync } from '@/hooks/useConvexUserSync';
import { AddressEditorApi, makeEmptyAddress, useAddressEditor } from '@/hooks/useAddressEditor';

export type AddressEditorMode = 'add' | 'edit';

export interface AddressBookApi {
  addresses: DeliveryAddress[];
  defaultIndex: number;
  editor: AddressEditorApi;
  editorOpen: boolean;
  editorMode: AddressEditorMode;
  editorTitle: string;
  submitLabel: string;
  openAdd: () => void;
  openEdit: (index: number) => Promise<void>;
  closeEditor: () => void;
  saveAddress: () => void;
  setDefaultAddress: (index: number) => void;
  removeAddress: (index: number) => void;
}

export function useAddressBook(): AddressBookApi {
  const { message, modal } = App.useApp();
  const { current, isAuthedWithConvex } = useConvexUserSync();
  const addAddress = useMutation(api.users.addAddress);
  const updateAddress = useMutation(api.users.updateAddress);
  const removeAddressConvex = useMutation(api.users.removeAddress);
  const setDefaultConvexAddress = useMutation(api.users.setDefaultAddress);

  const user = useSyncExternalStore(
    subscribeSessionUser,
    getSessionUserSnapshot,
    () => DEMO_BUYER
  );
  const editor = useAddressEditor();

  const convexAddresses = useMemo(() => current?.addresses ?? [], [current]);

  const convexDeliveryAddresses = useMemo(
    () => convexAddresses.map(toDeliveryAddress),
    [convexAddresses]
  );
  const demoAddresses = getDeliveryAddresses(user);

  const addresses = isAuthedWithConvex ? convexDeliveryAddresses : demoAddresses;

  const sessionDefaultIndex = getDefaultAddressIndex(user);
  const convexDefaultIndex = Math.max(
    0,
    convexAddresses.findIndex((a) => a.isDefault)
  );
  const defaultIndex = isAuthedWithConvex
    ? convexDefaultIndex
    : sessionDefaultIndex;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<AddressEditorMode>('add');
  const [editingIndex, setEditingIndex] = useState(0);

  const openAdd = () => {
    setEditorMode('add');
    setEditingIndex(addresses.length);
    editor.open(
      makeEmptyAddress({
        receiverName: user.fullName,
        receiverPhone: user.mobileNumber,
      })
    );
    setEditorOpen(true);
  };

  const openEdit = async (index: number) => {
    const target: DeliveryAddress | undefined = isAuthedWithConvex
      ? convexAddresses[index]
        ? toDeliveryAddress(convexAddresses[index])
        : undefined
      : demoAddresses[index];
    if (!target) return;
    setEditorMode('edit');
    setEditingIndex(index);
    await editor.open(target);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    editor.reset();
    setEditorOpen(false);
  };

  const saveAddress = () => {
    const errs = editor.validate();
    if (Object.keys(errs).length > 0) return;

    const saved = { ...editor.draftAddress };
    const addressInput = {
      label: saved.label ?? 'Home',
      receiverName: saved.receiverName,
      receiverPhone: saved.receiverPhone,
      region: saved.region,
      province: saved.province,
      cityMunicipality: saved.cityMunicipality,
      barangay: saved.barangay,
      streetBuilding: saved.streetBuilding,
      postalCode: saved.postalCode,
    };

    if (isAuthedWithConvex) {
      if (editorMode === 'add') {
        addAddress({
          address: { ...addressInput, isDefault: convexAddresses.length === 0 },
        }).catch(() => message.error('Could not save the address. Please try again.'));
      } else {
        const doc = convexAddresses[editingIndex];
        if (doc) {
          updateAddress({
            addressId: doc._id,
            address: { ...addressInput, isDefault: doc.isDefault },
          }).catch(() => message.error('Could not update the address. Please try again.'));
        }
      }
      closeEditor();
      message.success(editorMode === 'add' ? 'New address added' : 'Address updated');
      return;
    }

    const demo = getDeliveryAddresses(user);
    let next: DeliveryAddress[];
    let defIndex = defaultIndex;

    if (editorMode === 'add') {
      next = [...demo, saved];
      if (demo.length === 0) defIndex = 0;
    } else {
      next = demo.map((a, i) => (i === editingIndex ? saved : a));
    }

    if (defIndex >= next.length) defIndex = Math.max(0, next.length - 1);

    persistUserAddresses(user, next, defIndex);
    closeEditor();
    message.success(editorMode === 'add' ? 'New address added' : 'Address updated');
  };

  const setDefaultAddress = (index: number) => {
    if (index === defaultIndex) return;
    if (isAuthedWithConvex) {
      const doc = convexAddresses[index];
      if (!doc) return;
      setDefaultConvexAddress({ addressId: doc._id }).catch(() =>
        message.error('Could not update the default address. Please try again.')
      );
      message.success('Default address updated');
      return;
    }
    const demo = getDeliveryAddresses(user);
    persistUserAddresses(user, demo, index);
    message.success('Default address updated');
  };

  const removeAddress = (index: number) => {
    const target = addresses[index];
    if (!target) return;
    modal.confirm({
      title: 'Remove this address?',
      content: formatAddressSummary(target),
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Keep it',
      onOk: () => {
        if (isAuthedWithConvex) {
          const doc = convexAddresses[index];
          if (doc) {
            removeAddressConvex({ addressId: doc._id }).catch(() =>
              message.error('Could not remove the address. Please try again.')
            );
            message.success('Address removed');
          }
          return;
        }
        const demo = getDeliveryAddresses(user);
        const next = demo.filter((_, i) => i !== index);
        const defIndex = next.length === 0 ? 0 : Math.min(defaultIndex, next.length - 1);
        persistUserAddresses(user, next, defIndex);
        message.success('Address removed');
      },
    });
  };

  return {
    addresses,
    defaultIndex,
    editor,
    editorOpen,
    editorMode,
    editorTitle: editorMode === 'add' ? 'Add a delivery address' : 'Edit delivery address',
    submitLabel: editorMode === 'add' ? 'Save address' : 'Save changes',
    openAdd,
    openEdit,
    closeEditor,
    saveAddress,
    setDefaultAddress,
    removeAddress,
  };
}