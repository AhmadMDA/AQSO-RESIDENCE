
import { faDesktop, faMobileAlt, faTabletAlt } from '@fortawesome/free-solid-svg-icons';

const trafficShares = [
    { id: 1, label: "Type 70", value: /* [[TYPE_70_VALUE]] */ 70, color: "secondary", icon: faDesktop },
    { id: 2, label: "Type 55", value: /* [[TYPE_55_VALUE]] */ 55, color: "primary", icon: faMobileAlt },
    { id: 3, label: "Type 35", value: /* [[TYPE_35_VALUE]] */ 35, color: "tertiary", icon: faTabletAlt }
];

const totalOrders = [
    { id: 1, label: "July", value: [1, 5, 2, 5, 4, 3], color: "primary" },
    { id: 2, label: "August", value: [2, 3, 4, 8, 1, 2], color: "secondary" }
];

export {
    trafficShares,
    totalOrders
};