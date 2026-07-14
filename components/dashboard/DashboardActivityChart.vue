<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="bg-white border rounded p-6 lg:col-span-2">
      <h3 class="text-lg font-medium mb-4">{{ t("dashboard.chart.activityTitle") }}</h3>
      <div v-if="hasTrendData" class="h-64">
        <Line :data="trendChartData" :options="trendChartOptions" />
      </div>
      <div v-else class="h-64 flex items-center justify-center text-gray-500 text-sm">
        {{ t("dashboard.chart.noActivity") }}
      </div>
    </div>

    <div class="bg-white border rounded p-6">
      <h3 class="text-lg font-medium mb-4">{{ t("dashboard.chart.actionsTitle") }}</h3>
      <div v-if="hasBreakdownData" class="h-64">
        <Doughnut :data="breakdownChartData" :options="breakdownChartOptions" />
      </div>
      <div v-else class="h-64 flex items-center justify-center text-gray-500 text-sm">
        {{ t("dashboard.chart.noActions") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from "chart.js";
import { Line, Doughnut } from "vue-chartjs";
import type {
  DashboardActionBreakdown,
  DashboardTrendDay,
} from "~/types/dashboard";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement
);

const { t } = useI18n();

const props = defineProps<{
  trend7d: DashboardTrendDay[];
  actionBreakdown: DashboardActionBreakdown;
}>();

function formatDayLabel(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${day}.${month}`;
}

const hasTrendData = computed(() =>
  props.trend7d.some((day) => day.messages > 0 || day.violations > 0)
);

const hasBreakdownData = computed(() => {
  const b = props.actionBreakdown;
  return b.warning + b.delete + b.ban > 0;
});

const trendChartData = computed(() => ({
  labels: props.trend7d.map((day) => formatDayLabel(day.date)),
  datasets: [
    {
      label: t("dashboard.chart.messages"),
      data: props.trend7d.map((day) => day.messages),
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.1)",
      tension: 0.3,
    },
    {
      label: t("dashboard.chart.violations"),
      data: props.trend7d.map((day) => day.violations),
      borderColor: "#dc2626",
      backgroundColor: "rgba(220, 38, 38, 0.1)",
      tension: 0.3,
    },
  ],
}));

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" as const },
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
};

const breakdownChartData = computed(() => ({
  labels: [
    t("dashboard.chart.warnings"),
    t("dashboard.chart.deletes"),
    t("dashboard.chart.bans"),
  ],
  datasets: [
    {
      data: [
        props.actionBreakdown.warning,
        props.actionBreakdown.delete,
        props.actionBreakdown.ban,
      ],
      backgroundColor: ["#eab308", "#f97316", "#dc2626"],
    },
  ],
}));

const breakdownChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" as const },
  },
};
</script>
