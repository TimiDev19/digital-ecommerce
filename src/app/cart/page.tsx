'use client';
import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {useRouter} from 'next/navigation';
import {openCart} from '@/lib/cart';
export default function CartPage(){const dispatch=useDispatch();const router=useRouter();useEffect(()=>{dispatch(openCart());router.replace('/shop')},[dispatch,router]);return null}
