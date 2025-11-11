// src/store/utils.js
let _id = 100;
export function nextId() { return ++_id; }

export function nowISO() { return new Date().toISOString(); }
