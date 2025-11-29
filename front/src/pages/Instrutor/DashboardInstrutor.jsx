// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Briefcase,
  CheckCircle,
  Loader,
  BookOpen
} from "lucide-react";
import SidebarUnificada from "@/components/layout/Sidebar/SidebarUnificada";
import { sidebarConfigs } from "@/components/layout/Sidebar/sidebarConfigs";
import { useSidebar } from "@/context/SidebarContext";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

// --- COMPONENTES UI REUTILIZÁVEIS ---

const StatCard = ({ icon: Icon, label, value, color, loading, subtext }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs sm:text-sm text-gray-600 mb-1">{label}</p>
        {loading ? (
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        ) : (
          <>
            <p
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: color || "#313A4E" }}
            >
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                {subtext}
              </p>
            )}
          </>
        )}
      </div>
      <div
        className="p-2 sm:p-3 rounded-lg flex-shrink-0"
        style={{ backgroundColor: `${color || "#313A4E"}20` }}
      >
        <Icon size={24} style={{ color: color || "#313A4E" }} />
      </div>
    </div>
  </div>
);

const NextClassItem = ({ title, date, time, studio, studentsCount }) => (
  <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 mt-1">
        <Clock size={18} className="text-blue-600" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
          {title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-gray-600">
           <span className="flex items-center gap-1">
             <Calendar size={14} /> {date}
           </span>
           {/* Só mostra o horário se ele for válido */}
           <span className="text-[#67AF97] font-medium">
             {time && time !== "00:00" ? time : "--:--"}
           </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{studio} • {studentsCount} alunos</p>
      </div>
    </div>
  </div>
);

// --- PÁGINA PRINCIPAL ---

export default function DashboardInstrutor() {
  const navigate = useNavigate();
  const { isMobile, sidebarWidth } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);

  // Estado para as informações da Sidebar
  const defaultUserInfo = sidebarConfigs.instrutor.userInfo; 
  const [userInfo, setUserInfo] = useState(defaultUserInfo);

  // Estados de Dados do Dashboard
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Instrutor"); 
  const [stats, setStats] = useState({
    aulasHoje: 0,
    aulasMes: 0,
    totalAlunos: 0,
    estudios: 0
  });
  const [nextClasses, setNextClasses] = useState([]);
  const [chartModalidades, setChartModalidades] = useState([]);
  const [chartDias, setChartDias] = useState([]);

  const COLORS = ["#67AF97", "#2B668B", "#F59E0B", "#EF4444"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Buscar usuário logado
      const userRes = await api.get("/users/me");
      const userData = userRes.data;
      
      setUserInfo({
        name: userData.name_user || userData.nome || defaultUserInfo.name,
        email: userData.email_user || userData.email || defaultUserInfo.email,
      });
      
      // Proteção caso o nome venha nulo
      const primeiroNome = (userData.name_user || userData.nome || "Instrutor").split(' ')[0];
      setUserName(primeiroNome);

      // 2. Buscar Aulas do Mês Atual
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      const todayStr = date.toISOString().split('T')[0];

      const aulasRes = await api.get("/agenda/minhas_aulas", {
        params: { start_date: firstDay, end_date: lastDay }
      });

      const aulas = aulasRes.data || [];

      // --- PROCESSAMENTO DOS DADOS ---

      // KPI: Aulas Hoje
      const aulasHojeCount = aulas.filter(a => {
        const dataAula = a.dataAgendaAula || a.data_aula || "";
        // Verifica se a data começa com a string de hoje "YYYY-MM-DD"
        return dataAula.startsWith(todayStr);
      }).length;

      // KPI: Total Alunos Únicos
      const alunosSet = new Set();
      aulas.forEach(aula => {
        const lista = aula.participantes || aula.estudantes || aula.estudantes_a_matricular || [];
        // Tenta pegar ID de várias formas possíveis
        lista.forEach(p => {
            if (typeof p === 'object') alunosSet.add(p.id || p.id_estudante || p.id_user);
            else alunosSet.add(p); // Caso seja só um array de IDs
        });
      });

      // Gráfico: Modalidades
      const modalidadesCount = {};
      aulas.forEach(a => {
        const mod = a.disciplina || a.titulo_aula || "Geral";
        modalidadesCount[mod] = (modalidadesCount[mod] || 0) + 1;
      });
      const pieData = Object.keys(modalidadesCount).map(key => ({
        name: key,
        value: modalidadesCount[key]
      }));

      // Gráfico: Aulas por dia
      const diasCount = {};
      aulas.forEach(a => {
        const dataStr = a.dataAgendaAula || a.data_aula;
        if(!dataStr) return;
        // Pega o dia (DD) da string YYYY-MM-DD
        const dia = dataStr.split('T')[0].split('-')[2]; 
        diasCount[dia] = (diasCount[dia] || 0) + 1;
      });
      
      const barData = Object.keys(diasCount).sort().map(dia => ({
        name: `Dia ${dia}`,
        aulas: diasCount[dia]
      })).slice(0, 10); // Limite visual

      // Lista: Próximas Aulas (Lógica Blindada de Horário e Data)
      // Usamos data local "en-CA" (YYYY-MM-DD) para comparar strings e evitar bugs de fuso horário
      const todayLocalISO = new Date().toLocaleDateString('en-CA'); 
      
      const futuras = aulas
        .map(a => {
            // 1. Normaliza Data para String YYYY-MM-DD
            const rawData = a.dataAgendaAula || a.data_aula || "";
            const dataStr = rawData.includes('T') ? rawData.split('T')[0] : rawData;
            
            // 2. Extrai Horário com prioridade para campos SQL
            let time = "00:00";
            const rawTime = a.horario_inicio || a.horario || a.time;
            
            if (rawTime) {
                time = String(rawTime).substring(0, 5);
            } else if (rawData.includes('T')) {
                // Extrai da ISO se não tiver campo explícito
                time = rawData.split('T')[1].substring(0, 5);
            }

            return { ...a, dataNormalizada: dataStr, horarioVisual: time };
        })
        .filter(a => {
            if (!a.dataNormalizada) return false;
            // Compara string "2025-11-29" >= "2025-11-29". Funciona perfeitamente.
            return a.dataNormalizada >= todayLocalISO;
        })
        .sort((a, b) => {
            // Ordena primeiro por data, depois por hora
            if (a.dataNormalizada === b.dataNormalizada) {
                return a.horarioVisual.localeCompare(b.horarioVisual);
            }
            return a.dataNormalizada.localeCompare(b.dataNormalizada);
        });

      // Atualizar Estados
      setStats({
        aulasHoje: aulasHojeCount,
        aulasMes: aulas.length,
        totalAlunos: alunosSet.size,
        estudios: 1 
      });
      setNextClasses(futuras.slice(0, 4)); 
      setChartModalidades(pieData);
      setChartDias(barData);

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 pt-0 font-inter">
      <SidebarUnificada
        menuItems={sidebarConfigs.instrutor.menuItems}
        userInfo={userInfo}
        isOpen={menuOpen}
        onOpenChange={setMenuOpen}
      />

      <div
        className="flex flex-col flex-1 transition-all duration-300 min-w-0 w-full"
        style={{
          marginLeft: !isMobile ? `${sidebarWidth}px` : "0",
          width: !isMobile ? `calc(100% - ${sidebarWidth}px)` : "100%",
        }}
      >
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto mt-16 md:mt-0">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-8">
            
            {/* Cabeçalho */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Olá, {userName}! 👋</h1>
                <p className="text-gray-600 mt-1">Aqui está o resumo das suas atividades este mês.</p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-500">Hoje é</p>
                <p className="font-medium text-gray-900">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Calendar}
                label="Aulas Hoje"
                value={stats.aulasHoje}
                color="#F59E0B" 
                loading={loading}
                subtext="Aulas agendadas para hoje"
              />
              <StatCard
                icon={CheckCircle}
                label="Aulas no Mês"
                value={stats.aulasMes}
                color="#2B668B" 
                loading={loading}
                subtext="Total confirmado este mês"
              />
              <StatCard
                icon={Users}
                label="Meus Alunos"
                value={stats.totalAlunos}
                color="#67AF97" 
                loading={loading}
                subtext="Alunos distintos atendidos"
              />
              <StatCard
                icon={Briefcase}
                label="Estúdio"
                value="Ativo"
                color="#8B5CF6" 
                loading={loading}
                subtext="Vinculado ao Estúdio"
              />
            </section>

            {/* Gráficos e Listas */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Gráfico de Barras */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-gray-500" /> Volume de Aulas (Dias do Mês)
                </h3>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader className="h-8 w-8 animate-spin text-gray-300" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartDias}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="aulas" fill="#2B668B" radius={[4, 4, 0, 0]} name="Aulas" barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Gráfico de Pizza (Modalidades) */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-gray-500" /> Modalidades
                </h3>
                {loading ? (
                  <div className="h-[250px] flex items-center justify-center">
                      <Loader className="h-8 w-8 animate-spin text-gray-300" />
                  </div>
                ) : chartModalidades.length > 0 ? (
                  <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartModalidades}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartModalidades.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                    Sem dados suficientes.
                  </div>
                )}
              </div>
            </section>

            {/* Lista de Próximas Aulas */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                   <Calendar size={20} className="text-gray-500" /> Próximas Aulas Agendadas
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {loading ? (
                   <div className="p-8 text-center">
                      <Loader className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                   </div>
                ) : nextClasses.length > 0 ? (
                  nextClasses.map((cls, idx) => {
                    // Usa a dataNormalizada que já tratamos
                    // ATENÇÃO: new Date(string) aqui pode aplicar fuso horário, mas para exibição visual pt-BR geralmente fica ok
                    // Se der erro visual, use split direto
                    const dataObj = new Date(cls.dataNormalizada + "T00:00:00"); 
                    const dateStr = dataObj.toLocaleDateString('pt-BR');
                    
                    const timeStr = cls.horarioVisual || "00:00";
                    
                    const count = cls.participantes ? cls.participantes.length : 0;
                    const studioName = cls.EstudioID === 1 || cls.fk_id_estudio === 1 ? 'Estúdio Itaquera' : 'Estúdio São Miguel';

                    return (
                      <NextClassItem 
                        key={cls.id || idx}
                        title={cls.disciplina || cls.titulo_aula || 'Aula de Pilates'}
                        date={dateStr}
                        time={timeStr}
                        studio={studioName}
                        studentsCount={count}
                      />
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Nenhuma aula futura encontrada para este mês.
                  </div>
                )}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}