'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { App } from 'antd';
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
  const user = useSyncExternalStore(
    subscribeSessionUser,
    getSessionUserSnapshot,
    () => DEMO_BUYER
  );
  const editor = useAddressEditor();

  const defaultIndex = useMemo(() => getDefaultAddressIndex(user), [user]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<AddressEditorMode>('add');
  const [editingIndex, setEditingIndex] = useState(0);

  const openAdd = () => {
    setEditorMode('add');
    setEditingIndex(getDeliveryAddresses(user).length);
    editor.open(
      makeEmptyAddress({
        receiverName: user.fullName,
        receiverPhone: user.mobileNumber,
      })
    );
    setEditorOpen(true);
  };

  const openEdit = async (index: number) => {
    const target = getDeliveryAddresses(user)[index];
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

    const addresses = getDeliveryAddresses(user);
    const saved = { ...editor.draftAddress };
    let next: DeliveryAddress[];
    let defIndex = defaultIndex;

    if (editorMode === 'add') {
      next = [...addresses, saved];
      if (addresses.length === 0) defIndex = 0;
    } else {
      next = addresses.map((a, i) => (i === editingIndex ? saved : a));
    }

    if (defIndex >= next.length) defIndex = Math.max(0, next.length - 1);

    persistUserAddresses(user, next, defIndex);
    closeEditor();
    message.success(editorMode === 'add' ? 'New address added' : 'Address updated');
  };

  const setDefaultAddress = (index: number) => {
    if (index === defaultIndex) return;
    const addresses = getDeliveryAddresses(user);
    persistUserAddresses(user, addresses, index);
    message.success('Default address updated');
  };

  const removeAddress = (index: number) => {
    const addresses = getDeliveryAddresses(user);
    const target = addresses[index];
    if (!target) return;
    modal.confirm({
      title: 'Remove this address?',
      content: formatAddressSummary(target),
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Keep it',
      onOk: () => {
        const next = addresses.filter((_, i) => i !== index);
        const defIndex = next.length === 0 ? 0 : Math.min(defaultIndex, next.length - 1);
        persistUserAddresses(user, next, defIndex);
        message.success('Address removed');
      },
    });
  };

  return {
    addresses: getDeliveryAddresses(user),
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