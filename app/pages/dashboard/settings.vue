<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>Configurações da Loja</h1>
        <p class="page-description">Gerencie as informações e configurações gerais da sua loja</p>
      </div>
    </div>

    <!-- Navegação Lateral (Desktop) -->
    <nav v-if="!loading && isDesktop" class="settings-nav">
      <div class="nav-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
        <span>Navegação</span>
      </div>
      <ul class="nav-list">
        <li 
          v-for="section in navigationSections" 
          :key="section.id"
          :class="['nav-item', { active: activeSection === section.id }]"
        >
          <a 
            :href="`#${section.id}`"
            @click.prevent="scrollToSection(section.id)"
            class="nav-link"
          >
            <span class="nav-link-text">{{ section.title }}</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="loading">
      <div class="loading-skeleton">
        <div class="skeleton-section" v-for="n in 5" :key="n">
          <div class="skeleton-header"></div>
          <div class="skeleton-field"></div>
          <div class="skeleton-field"></div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div v-else class="settings-content">
      <!-- Informações Básicas -->
      <div id="informacoes-basicas" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <h2>Informações Básicas</h2>
        </div>
        
        <div class="form-group">
          <label for="storeName">Nome da Loja *</label>
          <input
            id="storeName"
            v-model="form.storeName"
            type="text"
            placeholder="Ex: Restaurante Sabor da Casa"
            required
            maxlength="100"
          />
          <span class="char-count">{{ form.storeName?.length || 0 }}/100</span>
        </div>

        <div class="form-group">
          <label for="storePhone">Telefone da Loja</label>
          <input
            id="storePhone"
            v-model="form.storePhone"
            type="tel"
            placeholder="Ex: (11) 99999-9999"
            maxlength="20"
          />
          <small>Número de telefone para contato dos clientes</small>
        </div>

        <div class="form-group">
          <label for="whatsapp">WhatsApp</label>
          <input
            id="whatsapp"
            v-model="form.whatsapp"
            type="tel"
            placeholder="Ex: 5511999999999"
            maxlength="20"
          />
          <small>Número do WhatsApp (apenas números, com código do país)</small>
        </div>

        <div class="form-group">
          <label for="primaryColor">Cor Primária da Plataforma</label>
          <div class="color-picker-wrapper">
            <input
              id="primaryColor"
              v-model="form.primaryColor"
              type="color"
              class="color-picker"
            />
            <input
              v-model="form.primaryColor"
              type="text"
              class="color-input"
              placeholder="#ff8e24"
              pattern="^#[0-9A-Fa-f]{6}$"
              maxlength="7"
            />
            <button 
              type="button" 
              @click="resetPrimaryColor" 
              class="btn-reset-color"
              title="Restaurar cor padrão"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
            </button>
          </div>
          <small>A cor primária será aplicada em botões, links, bordas e elementos de destaque em toda a plataforma</small>
          <div class="color-preview">
            <div class="preview-item" :style="{ backgroundColor: form.primaryColor }">
              <span>Botão</span>
            </div>
            <div class="preview-item" :style="{ borderColor: form.primaryColor, color: form.primaryColor }">
              <span>Borda</span>
            </div>
            <div class="preview-item" :style="{ color: form.primaryColor }">
              <span>Texto</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Horário de Funcionamento -->
      <div id="horario-funcionamento" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <h2>Horário de Funcionamento</h2>
        </div>

        <div class="status-display">
          <span :class="['status-indicator', computedIsOpen ? 'open' : 'closed']">
            {{ computedIsOpen ? 'Aberta agora' : 'Fechada' }}
          </span>
          <p class="status-text">{{ getStatusText() }}</p>
        </div>

        <!-- Modo de Operação -->
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <div class="toggle-wrapper">
            <div class="toggle-info">
              <label for="storeMode" class="toggle-label">Modo de Operação</label>
              <small>Escolha como a loja será aberta e fechada</small>
            </div>
            <div class="mode-selector">
              <label class="mode-option" :class="{ active: form.storeMode === 'automatic' }">
                <input
                  type="radio"
                  v-model="form.storeMode"
                  value="automatic"
                  name="storeMode"
                />
                <div class="mode-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Automático</span>
                </div>
                <small>Baseado nos horários configurados</small>
              </label>
              <label class="mode-option" :class="{ active: form.storeMode === 'manual' }">
                <input
                  type="radio"
                  v-model="form.storeMode"
                  value="manual"
                  name="storeMode"
                />
                <div class="mode-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>Manual</span>
                </div>
                <small>Controle manual na sidebar</small>
              </label>
            </div>
          </div>
        </div>

        <div class="opening-hours">
          <div v-for="schedule in form.openingHours" :key="schedule.day" class="day-schedule">
            <div class="day-header">
              <label class="toggle">
                <input
                  v-model="schedule.enabled"
                  type="checkbox"
                />
                <span class="toggle-slider"></span>
              </label>
              <span class="day-name">{{ getDayName(schedule.day) }}</span>
            </div>
            <div v-if="schedule.enabled" class="time-inputs">
              <input
                v-model="schedule.open"
                type="time"
                class="time-input"
              />
              <span>até</span>
              <input
                v-model="schedule.close"
                type="time"
                class="time-input"
              />
            </div>
            <div v-else class="closed-label">
              Fechado
            </div>
          </div>
        </div>
      </div>

      <!-- Imagens da Loja -->
      <div id="imagens-loja" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <h2>Imagens da Loja</h2>
        </div>

        <div class="images-grid">
          <div class="form-group">
            <label for="logo">Logo da Loja</label>
            <div class="image-preview-wrapper">
              <img 
                :src="form.logo || '/logo.jpg'" 
                alt="Logo" 
                class="image-preview logo-preview"
                @click="openImageOverlay(form.logo)"
                style="cursor: pointer;"
              />
              <div class="image-info">
                <p>Recomendado: 150x150px</p>
                <p>Formato: JPG, PNG, WEBP</p>
                <p>Máximo: 5MB</p>
              </div>
            </div>
            <div class="upload-buttons">
              <label class="btn-upload">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleFileUpload($event, 'logo')"
                  :disabled="uploadingLogo"
                  style="display: none"
                />
                <span v-if="uploadingLogo" class="loading-spinner-inline"></span>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {{ uploadingLogo ? 'Enviando...' : 'Fazer Upload' }}
              </label>
              <span class="or-divider">ou</span>
              <input
                v-model="form.logo"
                type="url"
                placeholder="Cole uma URL"
                class="url-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="banner">Banner Principal</label>
            <div class="image-preview-wrapper">
              <img
                :src="form.banner || '/not_found.jpg'"
                alt="Banner"
                class="image-preview banner-preview"
                @click="openImageOverlay(form.banner)"
                style="cursor: pointer;"
              />
              <div class="image-info">
                <p>Recomendado: 1200x400px</p>
                <p>Formato: JPG, PNG, WEBP</p>
                <p>Máximo: 5MB</p>
              </div>
            </div>
            <div class="upload-buttons">
              <label class="btn-upload">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleFileUpload($event, 'banner')"
                  :disabled="uploadingBanner"
                  style="display: none"
                />
                <span v-if="uploadingBanner" class="loading-spinner-inline"></span>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {{ uploadingBanner ? 'Enviando...' : 'Fazer Upload' }}
              </label>
              <span class="or-divider">ou</span>
              <input
                v-model="form.banner"
                type="url"
                placeholder="Cole uma URL"
                class="url-input"
              />
            </div>
          </div>

          <!-- Banners extras para carrossel -->
          <div class="form-group">
            <label>Banners Extras (Carrossel)</label>
            <p class="field-hint">Adicione mais banners para criar um carrossel automático. O banner principal será sempre o primeiro.</p>

            <div v-for="(banner, index) in form.banners" :key="index" class="banner-extra-row">
              <img :src="banner || '/not_found.jpg'" class="banner-extra-thumb" @click="openImageOverlay(banner)" style="cursor:pointer;" />
              <input v-model="form.banners[index]" type="url" placeholder="URL do banner" class="url-input" style="flex:1;" />
              <button type="button" @click="removeBannerExtra(index)" class="btn-remove-banner">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <button type="button" @click="addBannerExtra" class="btn-add-banner">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Adicionar Banner
            </button>
          </div>

          <div class="form-group">
            <label for="infoImage">Imagem da Aba Informações</label>
            <p class="field-hint">Aparece no topo do modal de informações da loja (visível para os clientes)</p>
            <div class="image-preview-wrapper">
              <img
                :src="form.infoImage || '/not_found.jpg'"
                alt="Imagem Informações"
                class="image-preview banner-preview"
                @click="openImageOverlay(form.infoImage)"
                style="cursor: pointer;"
              />
              <div class="image-info">
                <p>Recomendado: 800x400px</p>
                <p>Formato: JPG, PNG, WEBP</p>
                <p>Máximo: 5MB</p>
              </div>
            </div>
            <div class="upload-buttons">
              <label class="btn-upload">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleFileUpload($event, 'infoImage')"
                  :disabled="uploadingInfoImage"
                  style="display: none"
                />
                <span v-if="uploadingInfoImage" class="loading-spinner-inline"></span>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {{ uploadingInfoImage ? 'Enviando...' : 'Fazer Upload' }}
              </label>
              <span class="or-divider">ou</span>
              <input
                v-model="form.infoImage"
                type="url"
                placeholder="Cole uma URL"
                class="url-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Configurações de Entrega -->
      <div id="configuracoes-entrega" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <h2>Configurações de Entrega</h2>
        </div>

        <div class="delivery-grid">
          <div class="form-group">
            <label for="deliveryMinTime">Tempo Mínimo (min)</label>
            <input
              id="deliveryMinTime"
              v-model.number="form.deliveryMinTime"
              type="number"
              min="0"
              step="5"
              placeholder="30"
            />
          </div>

          <div class="form-group">
            <label for="deliveryMaxTime">Tempo Máximo (min)</label>
            <input
              id="deliveryMaxTime"
              v-model.number="form.deliveryMaxTime"
              type="number"
              min="0"
              step="5"
              placeholder="60"
            />
          </div>

          <div class="form-group">
            <label for="minimumOrder">Pedido Mínimo (R$)</label>
            <input
              id="minimumOrder"
              v-model.number="form.minimumOrder"
              type="number"
              min="0"
              step="1.00"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <!-- Localização da Loja -->
      <div id="localizacao-loja" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <h2>Localização da Loja</h2>
        </div>

        <div class="form-group">
          <label for="storeAddress">Endereço da Loja</label>
          <div class="address-input-wrapper">
            <input
              id="storeAddress"
              v-model="form.location.address"
              type="text"
              placeholder="Ex: Avenida Paulista, 1578 - Bela Vista, São Paulo - SP"
              maxlength="200"
              @blur="geocodeAddress"
            />
            <button 
              @click="geocodeAddress" 
              type="button"
              class="btn-geocode"
              :disabled="geocoding || !form.location.address"
            >
              <svg v-if="!geocoding" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div v-else class="loading-spinner-inline"></div>
              {{ geocoding ? 'Localizando...' : 'Localizar no Mapa' }}
            </button>
          </div>
          <small>Digite o endereço completo da loja e clique em "Localizar no Mapa" para visualizar no mapa</small>
        </div>

        <div v-if="form.location.latitude && form.location.longitude" class="info-banner success">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>
            <strong>Endereço localizado!</strong>
            <span>A loja foi posicionada no mapa. Use o botão "Localizar no Mapa" para ajustar a posição.</span>
          </div>
        </div>

        <!-- Mapa de Visualização -->
        <div class="map-container">
          <div id="delivery-map" class="delivery-map"></div>
          <div class="map-legend">
            <h4>Zonas de Entrega:</h4>
            <div class="legend-items">
              <div class="legend-item">
                <div class="legend-marker store"></div>
                <span>Localização da Loja</span>
              </div>
              <div v-for="(zone, index) in form.deliveryZones" :key="index" class="legend-item">
                <div class="legend-circle" :style="{ borderColor: getZoneColor(index) }"></div>
                <span>{{ zone.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Zonas de Entrega -->
      <div id="zonas-entrega" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
          <h2>Zonas de Entrega por Distância</h2>
        </div>

        <div class="zones-list">
          <div v-for="(zone, index) in form.deliveryZones" :key="index" class="zone-item">
            <div class="zone-number">{{ index + 1 }}</div>
            <div class="zone-fields">
              <div class="form-group">
                <label>Até quantos km?</label>
                <input
                  v-model.number="zone.maxDistance"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="5"
                  @input="updateZoneLabel(index); validateZones()"
                />
              </div>
              <div class="form-group">
                <label>Taxa de Entrega (R$)</label>
                <input
                  v-model.number="zone.fee"
                  type="number"
                  min="0"
                  step="0.50"
                  placeholder="5.00"
                  @input="updateZoneLabel(index); validateZones()"
                  :class="{ 'input-error': zoneValidationErrors[index] }"
                />
                <small v-if="zoneValidationErrors[index]" class="error-message">
                  {{ zoneValidationErrors[index] }}
                </small>
              </div>
            </div>
            <button 
              v-if="form.deliveryZones.length > 1"
              @click="confirmRemoveZone(index)" 
              class="btn-delete"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>Excluir</span>
            </button>
          </div>
        </div>

        <button @click="addZone" type="button" class="btn-add-zone">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Adicionar Zona
        </button>

        <div class="info-banner" style="margin-top: 1rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            <strong>Como funciona:</strong>
            <span>A taxa de entrega será calculada automaticamente baseada na distância do cliente até a loja. Configure zonas crescentes (ex: 0-3km, 3-5km, 5-10km)</span>
          </div>
        </div>
      </div>

      <!-- CEPs Restritos -->
      <div id="ceps-restritos" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h2>CEPs Restritos <span class="danger-badge">Área de Perigo</span></h2>
        </div>

        <div class="info-banner danger" style="margin-bottom: 1.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <strong>Atenção:</strong>
            <span>CEPs adicionados aqui serão bloqueados no checkout. Clientes com esses CEPs não poderão finalizar pedidos.</span>
          </div>
        </div>

        <div class="restricted-ceps-list">
          <div v-for="(cep, index) in form.restrictedZipCodes" :key="index" class="restricted-cep-item">
            <div class="cep-input-wrapper">
              <input
                v-model="form.restrictedZipCodes[index]"
                type="text"
                placeholder="00000-000"
                maxlength="9"
                @input="formatCepInput(index)"
                class="cep-input"
              />
              <button 
                @click="removeRestrictedCep(index)" 
                class="btn-remove-cep"
                type="button"
                title="Remover CEP"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button @click="addRestrictedCep" type="button" class="btn-add-cep">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Adicionar CEP Restrito
        </button>
      </div>

      <!-- CEPs de Atendimento Extra -->
      <div id="ceps-extras" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <h2>CEPs de Atendimento Extra</h2>
        </div>

        <div class="info-banner" style="margin-bottom: 1.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>CEPs adicionados aqui serão atendidos mesmo fora das zonas normais. Use para endereços específicos que você conhece e deseja atender.</span>
        </div>

        <!-- Verificador de endereço -->
        <div class="cep-verificador">
          <h4>Verificar Endereço por CEP</h4>
          <div class="cep-verificador-row">
            <input
              v-model="cepVerificar"
              type="text"
              placeholder="00000-000"
              maxlength="9"
              class="cep-input"
              @input="cepVerificar = formatCepStr($event.target.value)"
              @keydown.enter="verificarCep"
            />
            <button @click="verificarCep" type="button" class="btn-verificar" :disabled="verificandoCep">
              {{ verificandoCep ? 'Buscando...' : 'Verificar' }}
            </button>
          </div>
          <div v-if="cepResultado" class="cep-resultado" :class="cepResultado.tipo">
            <svg v-if="cepResultado.tipo === 'sucesso'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ cepResultado.texto }}</span>
          </div>
        </div>

        <!-- Lista de CEPs extras -->
        <div class="restricted-ceps-list" style="margin-top: 1.5rem;">
          <div v-if="!form.extraZipCodes || form.extraZipCodes.length === 0" class="ceps-empty">
            Nenhum CEP extra cadastrado ainda.
          </div>
          <div v-for="(item, index) in form.extraZipCodes" :key="index" class="restricted-cep-item extra-cep-item">
            <div class="cep-input-wrapper">
              <div class="extra-cep-info">
                <span class="extra-cep-num">{{ item.cep }}</span>
                <span class="extra-cep-addr">{{ item.endereco || '' }}</span>
              </div>
              <button @click="removeExtraCep(index)" class="btn-remove-cep" type="button" title="Remover">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button @click="addExtraCep" type="button" class="btn-add-cep btn-add-cep--green" style="margin-top: 1rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Adicionar CEP Extra
        </button>
      </div>

      <!-- Campos do Checkout -->
      <div id="campos-checkout" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2s-.9-2-2-2m10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2s2-.9 2-2s-.9-2-2-2m-8.9-5h7.45c.75 0 1.41-.41 1.75-1.03L21 4.96L19.25 4l-3.7 7H8.53L4.27 2H1v2h2l3.6 7.59l-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7zM12 2l4 4l-4 4l-1.41-1.41L12.17 7H8V5h4.17l-1.59-1.59z"/>
          </svg>
          <h2>Campos do Checkout</h2>
        </div>
        
        <p class="section-description">
          Configure quais campos devem ser exibidos no formulário de checkout. Você pode habilitar/desabilitar campos e definir se são obrigatórios.
        </p>

        <div class="checkout-fields">
          <div class="field-group">
            <h3>Informações do Cliente</h3>
            <div class="field-item">
              <div class="field-info">
                <label>Nome do Cliente</label>
                <span class="field-description">Nome completo do cliente</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.customerName.enabled"
                    @change="updateFieldRequired('customerName')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.customerName.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.customerName.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>

            <div class="field-item">
              <div class="field-info">
                <label>Telefone</label>
                <span class="field-description">Número de telefone para contato</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.customerPhone.enabled"
                    @change="updateFieldRequired('customerPhone')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.customerPhone.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.customerPhone.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>

            <div class="field-item">
              <div class="field-info">
                <label>E-mail</label>
                <span class="field-description">E-mail do cliente (opcional)</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.customerEmail.enabled"
                    @change="updateFieldRequired('customerEmail')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.customerEmail.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.customerEmail.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>
          </div>

          <div class="field-group">
            <h3>Endereço de Entrega</h3>
            <div class="field-item">
              <div class="field-info">
                <label>CEP</label>
                <span class="field-description">Código postal para cálculo do frete</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryZipCode.enabled"
                    @change="updateFieldRequired('deliveryZipCode')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.deliveryZipCode.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryZipCode.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>

            <div class="field-item">
              <div class="field-info">
                <label>Endereço</label>
                <span class="field-description">Rua, avenida, etc.</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryAddress.enabled"
                    @change="updateFieldRequired('deliveryAddress')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.deliveryAddress.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryAddress.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>

            <div class="field-item">
              <div class="field-info">
                <label>Complemento</label>
                <span class="field-description">Apartamento, casa, bloco, etc.</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryComplement.enabled"
                    @change="updateFieldRequired('deliveryComplement')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.deliveryComplement.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryComplement.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>

            <div class="field-item">
              <div class="field-info">
                <label>Bairro</label>
                <span class="field-description">Nome do bairro</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryNeighborhood.enabled"
                    @change="updateFieldRequired('deliveryNeighborhood')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.deliveryNeighborhood.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryNeighborhood.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>

            <div class="field-item">
              <div class="field-info">
                <label>Cidade</label>
                <span class="field-description">Nome da cidade</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryCity.enabled"
                    @change="updateFieldRequired('deliveryCity')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.deliveryCity.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.deliveryCity.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>
          </div>

          <div class="field-group">
            <h3>Pagamento e Observações</h3>
            
            <!-- Métodos de Pagamento Habilitados -->
            <div class="field-item">
              <div class="field-info">
                <label>Métodos de Pagamento Disponíveis</label>
                <span class="field-description">Selecione quais métodos de pagamento estarão disponíveis no checkout</span>
              </div>
              <div v-if="form.enabledPaymentMethods" class="payment-methods-config">
                <label class="payment-method-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="form.enabledPaymentMethods.pix"
                  />
                  <span class="payment-method-label">
                    <span class="payment-method-icon">PIX</span>
                    <span>PIX</span>
                  </span>
                </label>
                <label class="payment-method-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="form.enabledPaymentMethods.dinheiro"
                  />
                  <span class="payment-method-label">
                    <span class="payment-method-icon">💵</span>
                    <span>Dinheiro</span>
                  </span>
                </label>
                <label class="payment-method-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="form.enabledPaymentMethods.cartao"
                  />
                  <span class="payment-method-label">
                    <span class="payment-method-icon">💳</span>
                    <span>Cartão</span>
                  </span>
                </label>
              </div>
              <div v-else class="loading">
                <p>Carregando métodos de pagamento...</p>
              </div>
            </div>
            
            <div class="field-item">
              <div class="field-info">
                <label>Campo de Forma de Pagamento</label>
                <span class="field-description">Exibir campo de seleção de método de pagamento no checkout</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.paymentMethod.enabled"
                    @change="updateFieldRequired('paymentMethod')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.paymentMethod.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.paymentMethod.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>

            <div class="field-item">
              <div class="field-info">
                <label>Observações</label>
                <span class="field-description">Comentários adicionais do cliente</span>
              </div>
              <div class="field-controls">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.notes.enabled"
                    @change="updateFieldRequired('notes')"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <label class="required-switch" v-if="form.checkoutFields.notes.enabled">
                  <input 
                    type="checkbox" 
                    v-model="form.checkoutFields.notes.required"
                  />
                  <span class="required-text">Obrigatório</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notificações WhatsApp -->
      <div id="whatsapp-notifications" class="settings-section card">
        <div class="section-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h2>Notificações WhatsApp</h2>
        </div>

        <div class="whatsapp-info-box">
          <strong>Como funciona:</strong> Quando o status de um pedido muda, o sistema envia automaticamente uma mensagem WhatsApp para o cliente. Requer uma instância da <strong>Evolution API</strong> configurada e ativa.
        </div>

        <div class="form-group">
          <div class="toggle-row">
            <div>
              <label>Ativar notificações automáticas</label>
              <small>Envia WhatsApp ao cliente a cada mudança de status</small>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="form.whatsappNotificationsEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div v-if="form.whatsappNotificationsEnabled" class="whatsapp-api-fields">
          <div class="form-group">
            <label for="whatsappApiUrl">URL da Evolution API *</label>
            <input
              id="whatsappApiUrl"
              v-model="form.whatsappApiUrl"
              type="url"
              placeholder="Ex: https://api.seuservidor.com.br"
            />
            <small>URL base da sua instância Evolution API (sem barra no final)</small>
          </div>

          <div class="form-group">
            <label for="whatsappInstanceName">Nome da Instância *</label>
            <input
              id="whatsappInstanceName"
              v-model="form.whatsappInstanceName"
              type="text"
              placeholder="Ex: delivery"
            />
            <small>Nome da instância configurada na Evolution API</small>
          </div>

          <div class="form-group">
            <label for="whatsappApiToken">Chave da API (apikey) *</label>
            <input
              id="whatsappApiToken"
              v-model="form.whatsappApiToken"
              type="password"
              placeholder="Cole aqui a chave da sua API"
            />
            <small>Token de autenticação da Evolution API</small>
          </div>

          <div class="info-box" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:0.875rem;color:#92400e;">
            <strong>Mensagens enviadas por status:</strong>
            <ul style="margin:8px 0 0 0;padding-left:16px;line-height:1.8;">
              <li>Confirmado — "Seu pedido foi confirmado! Ja estamos preparando."</li>
              <li>Preparando — "Seu pedido esta sendo preparado agora!"</li>
              <li>Pronto — "Seu pedido esta pronto! Em breve saira para entrega."</li>
              <li>Saiu para entrega — "Seu pedido saiu para entrega! Aguarde."</li>
              <li>Entregue — "Pedido entregue! Obrigado pela preferencia."</li>
              <li>Cancelado — "Seu pedido foi cancelado."</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Botões de Ação -->
      <div class="actions-fixed">
        <div class="actions-container">
          <button @click="saveSettings" class="btn-primary" :disabled="submitting">
            <span v-if="submitting" class="loading-spinner-inline"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span v-if="submitting">Salvando...</span>
            <span v-else>Salvar Alterações</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Alert -->
    <div v-if="alert.show" :class="['alert', alert.type]">
      <div class="alert-icon">
        <svg v-if="alert.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22,4 12,14.01 9,11.01"></polyline>
        </svg>
        <svg v-else-if="alert.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <svg v-else-if="alert.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
      </div>
      <div class="alert-content">
        <div class="alert-message">{{ alert.message }}</div>
      </div>
      <button @click="alert.show = false" class="alert-close">×</button>
    </div>

    <!-- Modal de Confirmação de Remoção de Zona -->
    <div v-if="deleteZoneModal.show" class="modal-overlay" @click="deleteZoneModal.show = false">
      <div class="delete-modal" @click.stop>
        <div class="modal-header">
          <div class="warning-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h2>Confirmar Exclusão</h2>
        </div>
        
        <div class="modal-content">
          <p>Tem certeza que deseja excluir a zona de entrega <strong>"{{ deleteZoneModal.zoneLabel }}"</strong>?</p>
          <p class="warning-text">Esta ação não pode ser desfeita.</p>
        </div>
        
        <div class="modal-actions">
          <button @click="deleteZoneModal.show = false" class="btn-cancel">
            Cancelar
          </button>
          <button @click="executeRemoveZone" class="btn-delete-confirm">
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Image Overlay -->
  <ImageOverlay
    :show="showImageOverlay"
    :imageUrl="currentImageUrl"
    @close="closeImageOverlay"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import ImageOverlay from '~/components/ImageOverlay.vue'
import { useImageOverlay } from '~/composables/useImageOverlay'
import { useStoreStatus } from '~/composables/useStoreStatus'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'

// Image overlay
const { showImageOverlay, currentImageUrl, openImageOverlay, closeImageOverlay } = useImageOverlay()

// Store status composable
const { updateStoreMode, reloadStoreStatus } = useStoreStatus()

definePageMeta({
  layout: 'dashboard'
})

const loading = ref(true)
const submitting = ref(false)
const geocoding = ref(false)
const searchingCep = ref(false)
const storeCep = ref('')
const originalForm = ref(null)
const uploadingLogo = ref(false)
const uploadingBanner = ref(false)
const uploadingInfoImage = ref(false)
let map = null
let mapCircles = []
let storeMarker = null

// Navegação lateral
const isDesktop = ref(false)
const activeSection = ref('')
const navigationSections = [
  { id: 'informacoes-basicas', title: 'Informações Básicas' },
  { id: 'horario-funcionamento', title: 'Horário de Funcionamento' },
  { id: 'imagens-loja', title: 'Imagens da Loja' },
  { id: 'configuracoes-entrega', title: 'Configurações de Entrega' },
  { id: 'localizacao-loja', title: 'Localização da Loja' },
  { id: 'zonas-entrega', title: 'Zonas de Entrega' },
  { id: 'ceps-restritos', title: 'CEPs Restritos' },
  { id: 'ceps-extras', title: 'CEPs de Atendimento Extra' },
  { id: 'campos-checkout', title: 'Campos do Checkout' },
  { id: 'whatsapp-notifications', title: 'Notificações WhatsApp' }
]

// Campos de endereço separados
const addressFields = ref({
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: ''
})

const form = ref({
  storeName: '',
  logo: '',
  banner: '',
  infoImage: '',
  storePhone: '',
  whatsapp: '',
  whatsappNotificationsEnabled: false,
  whatsappApiUrl: '',
  whatsappApiToken: '',
  whatsappInstanceName: '',
  banners: [],
  location: {
    address: '',
    latitude: -23.550520,
    longitude: -46.633308
  },
  deliveryZones: [
    { maxDistance: 3, fee: 0, label: "Até 3km - Grátis" },
    { maxDistance: 5, fee: 5.00, label: "3-5km - R$ 5,00" },
    { maxDistance: 10, fee: 10.00, label: "5-10km - R$ 10,00" },
    { maxDistance: 15, fee: 15.00, label: "10-15km - R$ 15,00" }
  ],
  restrictedZipCodes: [],
  extraZipCodes: [],
  openingHours: [
    { day: 0, open: "11:00", close: "22:00", enabled: false },
    { day: 1, open: "11:00", close: "22:00", enabled: true },
    { day: 2, open: "11:00", close: "22:00", enabled: true },
    { day: 3, open: "11:00", close: "22:00", enabled: true },
    { day: 4, open: "11:00", close: "22:00", enabled: true },
    { day: 5, open: "11:00", close: "22:00", enabled: true },
    { day: 6, open: "11:00", close: "23:00", enabled: true },
  ],
  deliveryMinTime: 30,
  deliveryMaxTime: 60,
  deliveryFee: 5.00,
  minimumOrder: 0,
  storeMode: 'automatic', // 'automatic' ou 'manual'
  primaryColor: '#ff8e24', // Cor primária da plataforma
  enabledPaymentMethods: {
    pix: true,
    dinheiro: true,
    cartao: true
  },
  checkoutFields: {
    customerName: { enabled: true, required: true },
    customerPhone: { enabled: true, required: true },
    customerEmail: { enabled: true, required: false },
    deliveryAddress: { enabled: true, required: true },
    deliveryComplement: { enabled: true, required: false },
    deliveryNeighborhood: { enabled: true, required: true },
    deliveryCity: { enabled: true, required: true },
    deliveryZipCode: { enabled: true, required: true },
    paymentMethod: { enabled: true, required: true },
    notes: { enabled: true, required: false }
  }
})

const alert = ref({
  show: false,
  type: 'success',
  message: ''
})

const getDayName = (day) => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  return days[day]
}

// Cores para os raios de entrega
const zoneColors = [
  '#10b981', // Verde (grátis)
  '#3b82f6', // Azul
  '#f59e0b', // Laranja
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
]

const getZoneColor = (index) => {
  return zoneColors[index % zoneColors.length]
}

// Formatar CEP
const formatCep = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length <= 5) {
    storeCep.value = value
  } else {
    storeCep.value = value.substring(0, 5) + '-' + value.substring(5, 8)
  }
}

// Buscar endereço por CEP
const searchByCep = async () => {
  if (!storeCep.value || storeCep.value.replace(/\D/g, '').length !== 8) {
    showAlert('CEP inválido. Digite um CEP com 8 dígitos', 'error')
    return
  }
  
  searchingCep.value = true
  
  try {
    const cleanCep = storeCep.value.replace(/\D/g, '')
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    const data = await response.json()
    
    if (data.erro) {
      showAlert('CEP não encontrado', 'error')
      return
    }
    
    // Preencher campos separados
    addressFields.value = {
      street: data.logradouro || '',
      number: '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || ''
    }
    
    // Montar endereço completo
    const addressParts = []
    if (data.logradouro) addressParts.push(data.logradouro)
    if (data.bairro) addressParts.push(data.bairro)
    if (data.localidade) addressParts.push(data.localidade)
    if (data.uf) addressParts.push(data.uf)
    
    form.value.location.address = addressParts.join(', ')
    
    // Geocodificar automaticamente
    await geocodeAddress()
    
    showAlert('Endereço encontrado e localizado no mapa!', 'success')
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    showAlert('Erro ao buscar CEP', 'error')
  } finally {
    searchingCep.value = false
  }
}

// Sincronizar campos separados com endereço completo
const syncAddressFromFields = () => {
  const parts = []
  if (addressFields.value.street) parts.push(addressFields.value.street)
  if (addressFields.value.number) parts.push(addressFields.value.number)
  if (addressFields.value.neighborhood) parts.push(addressFields.value.neighborhood)
  if (addressFields.value.city) parts.push(addressFields.value.city)
  if (addressFields.value.state) parts.push(addressFields.value.state)
  
  if (parts.length > 0) {
    form.value.location.address = parts.join(', ')
  }
}

// Função para geocodificar endereço usando Nominatim (OpenStreetMap)
const geocodeAddress = async () => {
  if (!form.value.location.address || form.value.location.address.trim() === '') {
    showAlert('Por favor, insira um endereço', 'error')
    return
  }
  
  geocoding.value = true
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.value.location.address)}&limit=1&countrycodes=br`
    )
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      form.value.location.latitude = parseFloat(data[0].lat)
      form.value.location.longitude = parseFloat(data[0].lon)
      
      showAlert('Endereço localizado com sucesso!', 'success')
      
      // Atualizar mapa
      await nextTick()
      if (map) {
        updateStoreMarker()
      } else {
        initMap()
      }
    } else {
      showAlert('Endereço não encontrado. Tente ser mais específico (adicione cidade e estado)', 'error')
    }
  } catch (error) {
    console.error('Erro ao geocodificar:', error)
    showAlert('Erro ao localizar endereço', 'error')
  } finally {
    geocoding.value = false
  }
}

// Função para geocodificação reversa (coordenadas → endereço)
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    )
    
    const data = await response.json()
    
    if (data && data.address) {
      const address = data.address
      
      // Montar endereço formatado: rua, número, bairro, cidade, estado
      const parts = []
      
      // Rua
      const street = address.road || address.street || address.pedestrian || address.footway || ''
      if (street) parts.push(street)
      
      // Número
      if (address.house_number) parts.push(address.house_number)
      
      // Bairro
      const neighborhood = address.suburb || address.neighbourhood || address.quarter || ''
      if (neighborhood) parts.push(neighborhood)
      
      // Cidade
      const city = address.city || address.town || address.village || address.municipality || ''
      if (city) parts.push(city)
      
      // Estado
      if (address.state) parts.push(address.state)
      
      const formattedAddress = parts.join(', ')
      
      if (formattedAddress) {
        // Atualizar o endereço no formulário
        form.value.location.address = formattedAddress
        
        // Atualizar popup do marcador
        if (storeMarker) {
          storeMarker.bindPopup('<strong>Sua Loja</strong><br>' + formattedAddress).openPopup()
        }
        
        showAlert('Endereço atualizado com base na nova posição', 'success')
      } else {
        showAlert('Não foi possível obter um endereço detalhado', 'warning')
      }
    }
  } catch (error) {
    console.error('Erro ao obter endereço:', error)
    showAlert('Não foi possível obter o endereço da nova posição', 'warning')
  }
}

// Função para atualizar campo obrigatório quando desabilitado
const updateFieldRequired = (fieldName) => {
  if (!form.value.checkoutFields[fieldName].enabled) {
    form.value.checkoutFields[fieldName].required = false
  }
}

// Inicializar mapa
const initMap = () => {
  if (typeof window === 'undefined' || !window.L) return
  
  // Remover mapa existente se houver
  if (map) {
    map.remove()
  }
  
  // Verificar se o container do mapa existe
  const mapContainer = document.getElementById('delivery-map')
  if (!mapContainer) {
    console.warn('[Settings] Container do mapa não encontrado')
    return
  }
  
  const lat = form.value.location.latitude
  const lng = form.value.location.longitude
  
  // Criar mapa
  map = window.L.map('delivery-map').setView([lat, lng], 13)
  
  // Adicionar tiles do OpenStreetMap
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)
  
  // Adicionar marcador da loja (não arrastável)
  const storeIcon = window.L.divIcon({
    className: 'custom-store-marker',
    html: `<div class="store-marker-pin">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  })
  
  storeMarker = window.L.marker([lat, lng], { 
    icon: storeIcon,
    draggable: false // Marcador fixo, não arrastável
  }).addTo(map)
  
  storeMarker.bindPopup('<strong>Sua Loja</strong><br>' + (form.value.location.address || 'Localização da loja'))
  
  // Desenhar círculos de entrega
  updateMapCircles()
}

// Atualizar círculos no mapa
const updateMapCircles = () => {
  if (!map) return
  
  // Remover círculos antigos
  mapCircles.forEach(circle => map.removeLayer(circle))
  mapCircles = []
  
  const lat = form.value.location.latitude
  const lng = form.value.location.longitude
  
  // Ordenar zonas por distância (maior para menor para desenhar do maior para o menor)
  const sortedZones = [...form.value.deliveryZones].sort((a, b) => b.maxDistance - a.maxDistance)
  
  // Adicionar círculos para cada zona
  sortedZones.forEach((zone, index) => {
    const originalIndex = form.value.deliveryZones.findIndex(z => z === zone)
    const color = getZoneColor(originalIndex)
    
    const circle = window.L.circle([lat, lng], {
      radius: zone.maxDistance * 1000, // Converter km para metros
      color: color,
      fillColor: color,
      fillOpacity: 0.1,
      weight: 2
    }).addTo(map)
    
    circle.bindPopup(`<strong>${zone.label}</strong><br>Raio: ${zone.maxDistance}km`)
    mapCircles.push(circle)
  })
  
  // Ajustar zoom para mostrar todos os círculos
  if (sortedZones.length > 0) {
    const maxDistance = sortedZones[0].maxDistance
    const bounds = window.L.latLng(lat, lng).toBounds(maxDistance * 2000)
    map.fitBounds(bounds, { padding: [50, 50] })
  }
}

// Atualizar posição do marcador
const updateStoreMarker = () => {
  if (!map || !storeMarker) return
  
  const lat = form.value.location.latitude
  const lng = form.value.location.longitude
  
  storeMarker.setLatLng([lat, lng])
  map.setView([lat, lng], map.getZoom())
  updateMapCircles()
}

const computedIsOpen = computed(() => {
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  const todaySchedule = form.value.openingHours?.find(h => h.day === currentDay)
  
  if (!todaySchedule || !todaySchedule.enabled) {
    return false
  }
  
  return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close
})

const getStatusText = () => {
  const now = new Date()
  const currentDay = now.getDay()
  const todaySchedule = form.value.openingHours?.find(h => h.day === currentDay)
  
  if (!todaySchedule || !todaySchedule.enabled) {
    // Encontrar próximo dia aberto
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7
      const nextSchedule = form.value.openingHours?.find(h => h.day === nextDay)
      if (nextSchedule && nextSchedule.enabled) {
        return `Abre ${getDayName(nextDay)} às ${nextSchedule.open}`
      }
    }
    return 'Sem horários configurados'
  }
  
  if (computedIsOpen.value) {
    return `Fecha hoje às ${todaySchedule.close}`
  } else {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    if (currentTime < todaySchedule.open) {
      return `Abre hoje às ${todaySchedule.open}`
    } else {
      // Já fechou hoje, procurar próximo dia
      for (let i = 1; i <= 7; i++) {
        const nextDay = (currentDay + i) % 7
        const nextSchedule = form.value.openingHours?.find(h => h.day === nextDay)
        if (nextSchedule && nextSchedule.enabled) {
          return `Abre ${getDayName(nextDay)} às ${nextSchedule.open}`
        }
      }
    }
  }
  
  return ''
}

const showAlert = (message, type) => {
  alert.value = { show: true, message, type }
  setTimeout(() => {
    alert.value.show = false
  }, 3000)
}

const { authenticatedFetch } = useAuthenticatedFetch()

const loadSettings = async () => {
  try {
    loading.value = true
    const response = await authenticatedFetch('/api/settings')
    form.value = {
      storeName: response.storeName || '',
      logo: response.logo || '',
      banner: response.banner || '',
      infoImage: response.infoImage || '',
      storePhone: response.storePhone || '',
      whatsapp: response.whatsapp || '',
      whatsappNotificationsEnabled: response.whatsappNotificationsEnabled || false,
      whatsappApiUrl: response.whatsappApiUrl || '',
      whatsappApiToken: response.whatsappApiToken || '',
      whatsappInstanceName: response.whatsappInstanceName || '',
      banners: Array.isArray(response.banners) ? response.banners : [],
      location: response.location || form.value.location,
      deliveryZones: response.deliveryZones || form.value.deliveryZones,
      openingHours: response.openingHours || form.value.openingHours,
      deliveryMinTime: response.deliveryMinTime || 30,
      deliveryMaxTime: response.deliveryMaxTime || 60,
      deliveryFee: response.deliveryFee || 0,
      minimumOrder: response.minimumOrder || 0,
      storeMode: response.storeMode || 'automatic',
      primaryColor: response.primaryColor || '#ff8e24',
      enabledPaymentMethods: response.enabledPaymentMethods || {
        pix: true,
        dinheiro: true,
        cartao: true
      },
      checkoutFields: response.checkoutFields || form.value.checkoutFields,
      restrictedZipCodes: response.restrictedZipCodes || [],
      extraZipCodes: response.extraZipCodes || []
    }
    originalForm.value = JSON.parse(JSON.stringify(form.value))
    
    // Atualizar labels das zonas e validar
    form.value.deliveryZones.forEach((zone, index) => {
      updateZoneLabel(index)
    })
    validateZones()
  } catch (error) {
    showAlert('Erro ao carregar configurações', 'error')
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  // Validar zonas antes de salvar
  if (!validateZones()) {
    showAlert('Corrija os erros nas zonas de entrega antes de salvar', 'error')
    return
  }
  
  try {
    submitting.value = true
    
    // Preparar dados para envio
    const dataToSave = { ...form.value }
    
    // Se o modo for automático, garantir que manualOverride seja null
    if (dataToSave.storeMode === 'automatic') {
      dataToSave.manualOverride = null
    }
    
    await authenticatedFetch('/api/settings', {
      method: 'PUT',
      body: dataToSave
    })
    originalForm.value = JSON.parse(JSON.stringify(form.value))
    
    // Atualizar estado global usando o composable ANTES de mostrar o alerta
    // Isso garante que a sidebar seja atualizada imediatamente
    updateStoreMode(dataToSave.storeMode)
    
    // Aguardar nextTick para garantir que a reatividade foi processada
    await nextTick()
    
    // Recarregar status completo do backend (isso vai atualizar manualOverride e isStoreOpen também)
    await reloadStoreStatus()
    
    // Aguardar novamente para garantir que todas as atualizações foram processadas
    await nextTick()
    
    showAlert('Configurações salvas com sucesso!', 'success')
    
    // Aplicar cor primária após salvar
    applyPrimaryColor()
    
    // Disparar evento para atualizar a sidebar (fallback adicional)
    if (process.client) {
      // Pequeno delay para garantir que o estado foi atualizado
      await nextTick()
      window.dispatchEvent(new CustomEvent('store-settings-updated', {
        detail: { storeMode: dataToSave.storeMode }
      }))
    }
  } catch (error) {
    showAlert(error.data?.message || 'Erro ao salvar configurações', 'error')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  if (originalForm.value) {
    form.value = JSON.parse(JSON.stringify(originalForm.value))
    showAlert('Formulário redefinido', 'info')
  }
}

// Resetar cor primária para o padrão
const resetPrimaryColor = () => {
  form.value.primaryColor = '#ff8e24'
}

// Aplicar cor primária dinamicamente
const applyPrimaryColor = () => {
  if (process.client && form.value.primaryColor) {
    const root = document.documentElement
    const color = form.value.primaryColor
    
    // Calcular cor hover (escurecer 10%)
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Escurecer 10%
    const hoverR = Math.max(0, Math.floor(r * 0.9))
    const hoverG = Math.max(0, Math.floor(g * 0.9))
    const hoverB = Math.max(0, Math.floor(b * 0.9))
    
    const hoverColor = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`
    
    root.style.setProperty('--color-primary', color)
    root.style.setProperty('--color-primary-hover', hoverColor)
  }
}

// Watcher para aplicar cor quando mudar
watch(() => form.value.primaryColor, () => {
  applyPrimaryColor()
})

// Função para scroll suave até uma seção
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    const offset = 100 // Offset para compensar header fixo
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

// Detectar seção ativa durante o scroll
const handleScroll = () => {
  if (!process.client) return
  
  const scrollPosition = window.scrollY + 150 // Offset para ativar antes de chegar na seção
  
  for (let i = navigationSections.length - 1; i >= 0; i--) {
    const section = document.getElementById(navigationSections[i].id)
    if (section) {
      const sectionTop = section.offsetTop
      if (scrollPosition >= sectionTop) {
        activeSection.value = navigationSections[i].id
        break
      }
    }
  }
  
  // Se estiver no topo, definir primeira seção como ativa
  if (scrollPosition < 200) {
    activeSection.value = navigationSections[0].id
  }
}

// Verificar se é desktop
const checkIsDesktop = () => {
  if (process.client) {
    isDesktop.value = window.innerWidth >= 1024
  }
}

const addZone = () => {
  const lastZone = form.value.deliveryZones[form.value.deliveryZones.length - 1]
  const newMaxDistance = lastZone ? lastZone.maxDistance + 5 : 5
  const newFee = lastZone ? lastZone.fee + 5 : 5
  
  const newLabel = newFee === 0 
    ? `Até ${newMaxDistance}km - Grátis` 
    : `Até ${newMaxDistance}km - R$ ${newFee.toFixed(2)}`
  
  form.value.deliveryZones.push({
    maxDistance: newMaxDistance,
    fee: newFee,
    label: newLabel
  })
  
  // Atualizar mapa e validar
  nextTick(() => {
    updateMapCircles()
    validateZones()
  })
}

// Modal de confirmação de remoção de zona
const deleteZoneModal = ref({
  show: false,
  zoneIndex: null,
  zoneLabel: ''
})

const confirmRemoveZone = (index) => {
  const zone = form.value.deliveryZones[index]
  deleteZoneModal.value = {
    show: true,
    zoneIndex: index,
    zoneLabel: zone.label || `Zona ${index + 1}`
  }
}

const executeRemoveZone = () => {
  if (deleteZoneModal.value.zoneIndex !== null) {
    form.value.deliveryZones.splice(deleteZoneModal.value.zoneIndex, 1)
    
    // Atualizar mapa
    nextTick(() => {
      updateMapCircles()
    })
    
    showAlert('Zona removida com sucesso', 'success')
  }
  
  deleteZoneModal.value.show = false
}

const removeZone = (index) => {
  if (form.value.deliveryZones.length > 1) {
    form.value.deliveryZones.splice(index, 1)
    // Atualizar mapa
    nextTick(() => {
      updateMapCircles()
      validateZones()
    })
  }
}

// Erros de validação das zonas
const zoneValidationErrors = ref({})

// Atualizar label da zona
const updateZoneLabel = (index) => {
  const zone = form.value.deliveryZones[index]
  if (zone) {
    zone.label = zone.fee === 0 
      ? `Até ${zone.maxDistance}km - Grátis` 
      : `Até ${zone.maxDistance}km - R$ ${zone.fee.toFixed(2)}`
  }
}

// Funções para gerenciar CEPs restritos
const addRestrictedCep = () => {
  if (!form.value.restrictedZipCodes) {
    form.value.restrictedZipCodes = []
  }
  form.value.restrictedZipCodes.push('')
}

const removeRestrictedCep = (index) => {
  if (form.value.restrictedZipCodes && form.value.restrictedZipCodes.length > 0) {
    form.value.restrictedZipCodes.splice(index, 1)
  }
}

const formatCepInput = (index) => {
  let cep = form.value.restrictedZipCodes[index]
  if (!cep) return
  
  // Remove tudo que não é número
  cep = cep.replace(/\D/g, '')
  
  // Aplica máscara
  if (cep.length > 5) {
    cep = cep.substring(0, 5) + '-' + cep.substring(5, 8)
  }
  
  form.value.restrictedZipCodes[index] = cep
}

// === CEPs de Atendimento Extra ===
const cepVerificar = ref('')
const verificandoCep = ref(false)
const cepResultado = ref(null)

const formatCepStr = (val) => {
  if (!val) return ''
  let v = val.replace(/\D/g, '')
  if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5, 8)
  return v
}

const verificarCep = async () => {
  const cepLimpo = cepVerificar.value.replace(/\D/g, '')
  if (cepLimpo.length !== 8) {
    cepResultado.value = { tipo: 'erro', texto: 'CEP inválido. Digite 8 dígitos.' }
    return
  }
  verificandoCep.value = true
  cepResultado.value = null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const data = await res.json()
    if (data.erro) {
      cepResultado.value = { tipo: 'erro', texto: 'CEP não encontrado.' }
    } else {
      const partes = [data.logradouro, data.bairro, data.localidade, data.uf].filter(Boolean)
      cepResultado.value = {
        tipo: 'sucesso',
        texto: partes.join(', '),
        cep: data.cep,
        endereco: partes.join(', ')
      }
    }
  } catch (e) {
    cepResultado.value = { tipo: 'erro', texto: 'Erro ao consultar o CEP.' }
  } finally {
    verificandoCep.value = false
  }
}

const addExtraCep = () => {
  if (!cepResultado.value || cepResultado.value.tipo !== 'sucesso') {
    cepResultado.value = { tipo: 'erro', texto: 'Primeiro verifique um CEP válido acima.' }
    return
  }
  const jaExiste = (form.value.extraZipCodes || []).some(
    (item) => item.cep === cepResultado.value.cep
  )
  if (jaExiste) {
    cepResultado.value = { tipo: 'erro', texto: 'Este CEP já foi adicionado.' }
    return
  }
  if (!form.value.extraZipCodes) form.value.extraZipCodes = []
  form.value.extraZipCodes.push({
    cep: cepResultado.value.cep,
    endereco: cepResultado.value.endereco
  })
  cepVerificar.value = ''
  cepResultado.value = null
}

const removeExtraCep = (index) => {
  form.value.extraZipCodes.splice(index, 1)
}
// === Fim CEPs Extra ===

// Validar zonas de entrega
const validateZones = () => {
  zoneValidationErrors.value = {}
  
  if (form.value.deliveryZones.length < 1) {
    return true
  }
  
  // Criar cópia ordenada por distância
  const sortedZones = [...form.value.deliveryZones]
    .map((zone, index) => ({ ...zone, originalIndex: index }))
    .sort((a, b) => a.maxDistance - b.maxDistance)
  
  let hasError = false
  
  // Validar que distâncias maiores têm valores maiores ou iguais
  for (let i = 1; i < sortedZones.length; i++) {
    const prevZone = sortedZones[i - 1]
    const currentZone = sortedZones[i]
    
    // Se a distância atual é maior que a anterior, o valor deve ser maior ou igual
    if (currentZone.maxDistance > prevZone.maxDistance && currentZone.fee < prevZone.fee) {
      const errorKey = currentZone.originalIndex
      zoneValidationErrors.value[errorKey] = 
        `A taxa de entrega (R$ ${currentZone.fee.toFixed(2)}) não pode ser menor que a zona anterior (R$ ${prevZone.fee.toFixed(2)}) já que a distância é maior.`
      hasError = true
    }
    
    // Se a distância atual é menor que a anterior, o valor deve ser menor ou igual
    if (currentZone.maxDistance < prevZone.maxDistance && currentZone.fee > prevZone.fee) {
      const errorKey = currentZone.originalIndex
      zoneValidationErrors.value[errorKey] = 
        `A taxa de entrega (R$ ${currentZone.fee.toFixed(2)}) não pode ser maior que a zona anterior (R$ ${prevZone.fee.toFixed(2)}) já que a distância é menor.`
      hasError = true
    }
  }
  
  return !hasError
}

const addBannerExtra = () => {
  form.value.banners.push('')
}

const removeBannerExtra = (index) => {
  form.value.banners.splice(index, 1)
}

const handleFileUpload = async (event, type) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Validar tipo de arquivo
  if (!file.type.startsWith('image/')) {
    showAlert('Por favor, selecione uma imagem válida', 'error')
    return
  }
  
  // Validar tamanho (máx 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showAlert('Imagem muito grande. Máximo 5MB', 'error')
    return
  }
  
  try {
    if (type === 'logo') {
      uploadingLogo.value = true
    } else if (type === 'infoImage') {
      uploadingInfoImage.value = true
    } else {
      uploadingBanner.value = true
    }

    // Converter para base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result

        // Fazer upload
        const response = await authenticatedFetch('/api/upload-image', {
          method: 'POST',
          body: {
            image: base64,
            filename: file.name,
            type: type
          }
        })

        // Atualizar formulário com a imagem
        if (type === 'logo') {
          form.value.logo = response.imageUrl
        } else if (type === 'infoImage') {
          form.value.infoImage = response.imageUrl
        } else {
          form.value.banner = response.imageUrl
        }

        showAlert('Imagem carregada com sucesso!', 'success')
      } catch (error) {
        showAlert(error.data?.message || 'Erro ao fazer upload', 'error')
      } finally {
        if (type === 'logo') {
          uploadingLogo.value = false
        } else if (type === 'infoImage') {
          uploadingInfoImage.value = false
        } else {
          uploadingBanner.value = false
        }
      }
    }

    reader.onerror = () => {
      showAlert('Erro ao ler o arquivo', 'error')
      if (type === 'logo') {
        uploadingLogo.value = false
      } else if (type === 'infoImage') {
        uploadingInfoImage.value = false
      } else {
        uploadingBanner.value = false
      }
    }
    
    reader.readAsDataURL(file)
  } catch (error) {
    showAlert('Erro ao processar imagem', 'error')
    if (type === 'logo') {
      uploadingLogo.value = false
    } else if (type === 'infoImage') {
      uploadingInfoImage.value = false
    } else {
      uploadingBanner.value = false
    }
  }
}

onMounted(async () => {
  await loadSettings()
  
  // Aplicar cor primária após carregar configurações
  applyPrimaryColor()
  
  // Configurar navegação lateral
  checkIsDesktop()
  window.addEventListener('resize', checkIsDesktop)
  window.addEventListener('scroll', handleScroll)
  handleScroll() // Verificar seção inicial
  
  // Aguardar o Leaflet carregar e o DOM estar pronto
  const checkLeaflet = setInterval(() => {
    if (typeof window !== 'undefined' && window.L) {
      clearInterval(checkLeaflet)
      nextTick(() => {
        // Verificar se o container do mapa existe no DOM
        const mapContainer = document.getElementById('delivery-map')
        if (mapContainer && form.value.location.latitude && form.value.location.longitude) {
          initMap()
        }
      })
    }
  }, 100)
  
  // Timeout de segurança
  setTimeout(() => clearInterval(checkLeaflet), 5000)
  
  // Adicionar listener para ESC
  window.addEventListener('keydown', handleEscKey)
})

// Watcher para atualizar círculos quando zonas mudarem
watch(() => form.value.deliveryZones, () => {
  if (map) {
    nextTick(() => {
      updateMapCircles()
    })
  }
}, { deep: true })

// Watcher para sincronizar campos separados quando mudarem
watch(() => addressFields.value, () => {
  syncAddressFromFields()
}, { deep: true })

// Watcher para limpar manualOverride quando mudar para modo automático
watch(() => form.value.storeMode, (newMode) => {
  if (newMode === 'automatic') {
    // Quando mudar para automático, limpar o override manual
    // Isso será salvo quando o usuário salvar as configurações
  }
})

// Fechar modal com ESC
const handleEscKey = (event) => {
  if (event.key === 'Escape') {
    if (deleteZoneModal.value.show) {
      deleteZoneModal.value.show = false
    }
  }
}

onUnmounted(() => {
  if (map) {
    map.remove()
  }
  window.removeEventListener('keydown', handleEscKey)
  window.removeEventListener('resize', checkIsDesktop)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.settings-page {
  padding: 1rem;
  padding-bottom: 120px; /* Espaço para o botão fixo */
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

/* Navegação Lateral */
.settings-nav {
  position: fixed;
  top: 100px;
  right: 2rem;
  width: 240px;
  max-height: calc(100vh - 140px);
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 50;
  padding: 1rem 0;
}

.settings-nav::-webkit-scrollbar {
  width: 6px;
}

.settings-nav::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.settings-nav::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.settings-nav::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.nav-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-header svg {
  color: var(--color-primary, #ff8e24);
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin: 0;
}

.nav-link {
  display: block;
  padding: 0.625rem 1.25rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.875rem;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  position: relative;
}

.nav-link:hover {
  background: #f9fafb;
  color: #374151;
  border-left-color: #d1d5db;
}

.nav-item.active .nav-link {
  background: #f0f9ff;
  color: var(--color-primary, #ff8e24);
  border-left-color: var(--color-primary, #ff8e24);
  font-weight: 500;
}

.nav-link-text {
  display: block;
  line-height: 1.5;
}

/* Ajustar conteúdo quando navegação está visível */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
  position: relative;
}

@media (min-width: 1024px) {
  .settings-content {
    padding-right: 280px; /* Espaço para a navegação lateral */
  }
}

@media (max-width: 1023px) {
  .settings-nav {
    display: none;
  }
  
  .settings-content {
    padding-right: 0;
  }
}

/* Page Header - Padronizado */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  flex: 1;
}

.header-left h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
}

.page-description {
  color: #6b7280;
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.settings-section {
  padding: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--color-border-light);
}

.section-header svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.section-header h2 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.form-group {
  margin-bottom: var(--spacing-xl);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.form-group small {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
}

.form-group small.error-message {
  color: #dc2626;
  font-weight: 500;
}

.input-error {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
}

.char-count {
  display: block;
  text-align: right;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

/* Toggle Switch */
.toggle-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toggle-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.toggle-info small {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* Mode Selector */
.mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border: 2px solid var(--color-border-medium);
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.mode-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.mode-option:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.mode-option.active {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(255, 142, 36, 0.1) 0%, rgba(255, 142, 36, 0.05) 100%);
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.2);
}

.mode-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.mode-option.active .mode-content {
  color: var(--color-primary);
}

.mode-option svg {
  flex-shrink: 0;
}

.mode-option small {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
}

.mode-option.active small {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: var(--transition-base);
  border-radius: var(--radius-full);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: var(--transition-base);
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.status-badge.open {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-badge.closed {
  background: var(--color-error-bg);
  color: var(--color-error-text);
}

/* Status Display */
.status-display {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.status-indicator {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.status-indicator.open {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.status-indicator.closed {
  background: var(--color-error-bg);
  color: var(--color-error-text);
}

.status-text {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Opening Hours */
.opening-hours {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.day-schedule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-md);
  background: white;
  gap: var(--spacing-lg);
}

.day-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  min-width: 180px;
}

.day-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  justify-content: flex-end;
}

.time-input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  width: 100px;
}

.closed-label {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm) 0;
}

/* Images Grid */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-2xl);
}

.image-preview-wrapper {
  margin-bottom: var(--spacing-lg);
  border: 2px dashed var(--color-border-medium);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  text-align: center;
}

.image-preview {
  width: 100%;
  max-width: 200px;
  height: auto;
  object-fit: contain;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.logo-preview {
  max-width: 150px;
  aspect-ratio: 1;
  object-fit: cover;
}

.banner-preview {
  max-width: 100%;
  aspect-ratio: 3/1;
  object-fit: cover;
}

.image-info {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.field-hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}

.image-info p {
  margin: var(--spacing-xs) 0;
}

/* Upload Buttons */
.upload-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  line-height: 1;
}

.btn-upload svg,
.btn-upload .loading-spinner-inline {
  flex-shrink: 0;
  vertical-align: middle;
}

.btn-upload:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.or-divider {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.url-input {
  flex: 1;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

/* Delivery Grid */
.delivery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

/* Address Input */
.address-input-wrapper {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.address-input-wrapper input {
  flex: 1;
}

/* CEP Input */
.cep-input-wrapper {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.cep-input {
  flex: 1;
  max-width: 200px;
}

.btn-search-cep {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  min-height: 45px;
  line-height: 1;
}

.btn-search-cep:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-search-cep:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-search-cep svg,
.btn-search-cep .loading-spinner-inline {
  flex-shrink: 0;
  vertical-align: middle;
}

/* Address Fields Group */
.address-fields-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

/* Coordinates Display */
.coordinates-display {
  display: flex;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: var(--radius-md);
  border: 1px solid #bae6fd;
}

.coordinate-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.coordinate-item svg {
  color: #0284c7;
  flex-shrink: 0;
}

.coordinate-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.coordinate-label {
  font-size: var(--font-size-xs);
  color: #64748b;
  font-weight: 500;
}

.coordinate-value {
  font-size: var(--font-size-sm);
  color: #0c4a6e;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.btn-geocode {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  min-height: 45px;
}

.btn-geocode:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-geocode:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.info-banner.success {
  background: linear-gradient(135deg, #10b98120, #10b98110);
  border-color: var(--color-success);
}

.info-banner.success svg {
  color: var(--color-success);
}

.info-banner.danger {
  background: linear-gradient(135deg, #dc262620, #dc262610);
  border-color: #dc2626;
}

.info-banner.danger svg {
  color: #dc2626;
}

.danger-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #dc2626;
  color: white;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  margin-left: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* CEPs Restritos */
.restricted-ceps-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.restricted-cep-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cep-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.cep-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.cep-input:focus {
  outline: none;
  border-color: var(--color-primary, #ff8e24);
  box-shadow: 0 0 0 3px rgba(255, 142, 36, 0.1);
}

.btn-remove-cep {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #fee2e2;
  border: 2px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-remove-cep:hover {
  background: #fecaca;
  border-color: #f87171;
  transform: scale(1.05);
}

.btn-add-cep {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #fee2e2;
  border: 2px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.btn-add-cep:hover {
  background: #fecaca;
  border-color: #f87171;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

/* CEPs Extra */
.cep-verificador {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.cep-verificador h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cep-verificador-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.cep-verificador-row .cep-input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s;
}

.cep-verificador-row .cep-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-verificar {
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-verificar:hover:not(:disabled) {
  filter: brightness(0.9);
  transform: translateY(-1px);
}

.btn-verificar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cep-resultado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.cep-resultado.sucesso {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.cep-resultado.erro {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.extra-cep-item .cep-input-wrapper {
  justify-content: space-between;
}

.extra-cep-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.extra-cep-num {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--color-text);
  font-family: monospace;
}

.extra-cep-addr {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.btn-add-cep--green {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
}

.btn-add-cep--green:hover {
  background: #bbf7d0;
  border-color: #4ade80;
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.15);
}

.ceps-empty {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  text-align: center;
  padding: 1.25rem;
  border: 1.5px dashed var(--color-border);
  border-radius: 0.75rem;
}

.delivery-preview {
  margin-top: var(--spacing-xl);
}

.delivery-preview div {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.delivery-preview strong {
  font-weight: 600;
}

/* Actions */
.actions-fixed {
  position: fixed;
  bottom: 0;
  left: var(--sidebar-width, 280px);
  right: 0;
  background: white;
  border-top: 2px solid var(--color-border-light);
  z-index: 1000;
  transition: left 0.3s ease;
}

.actions-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg) var(--spacing-2xl);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-lg);
}

.settings-content {
  padding-bottom: 80px; /* Espaço para o botão fixo */
}

/* Botões Padronizados */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary, #ff8e24);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(255, 142, 36, 0.3);
  white-space: nowrap;
  min-height: 44px;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover, #e67e22);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 142, 36, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(255, 142, 36, 0.3);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Loading */
.loading {
  padding: 2rem 0;
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
}

.skeleton-section {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-header {
  height: 2rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xl);
  width: 40%;
}

.skeleton-field {
  height: 3rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.skeleton-field:last-child {
  margin-bottom: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.loading-spinner-inline {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Campos do Checkout */
.checkout-fields {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.field-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.field-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.payment-methods-config {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.payment-method-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-method-checkbox:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.payment-method-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #ff8e24);
}

.payment-method-checkbox input[type="checkbox"]:checked + .payment-method-label {
  color: #1e293b;
}

.payment-method-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  color: #6b7280;
  font-weight: 500;
}

.payment-method-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.field-info label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.field-description {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

.field-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.toggle-row label:first-child {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0;
}

.toggle-row small {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  margin-top: 2px;
}

.whatsapp-api-fields {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.banner-extra-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.banner-extra-thumb {
  width: 80px;
  height: 45px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.btn-remove-banner {
  background: none;
  border: 1px solid #dc2626;
  color: #dc2626;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.btn-add-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px dashed var(--color-border);
  color: var(--color-text-secondary);
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  transition: border-color 0.2s, color 0.2s;
}

.btn-add-banner:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.whatsapp-info-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #166534;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #10b981;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.required-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.required-switch input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #10b981;
}

.required-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .settings-page {
    padding: var(--spacing-lg);
  }
  
  .settings-section {
    padding: var(--spacing-lg);
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .header-left h1 {
    font-size: 1.5rem;
  }
  
  .page-description {
    font-size: 0.875rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .images-grid,
  .delivery-grid {
    grid-template-columns: 1fr;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .actions button {
    width: 100%;
    justify-content: center;
  }
  
  .toggle-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .day-schedule {
    flex-direction: column;
    align-items: stretch;
  }
  
  .day-header {
    min-width: auto;
    width: 100%;
  }
  
  .time-inputs {
    justify-content: flex-start;
  }
  
  .time-input {
    flex: 1;
  }
  
  .actions-fixed {
    left: 0;
  }
  
  .actions-container {
    padding: var(--spacing-lg);
    flex-direction: column;
  }
  
  .actions-container button {
    width: 100%;
    justify-content: center;
  }
  
  .upload-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-upload {
    width: 100%;
    justify-content: center;
  }
  
  .or-divider {
    text-align: center;
  }
}

/* Mapa de Entrega */
.map-container {
  margin-top: var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.delivery-map {
  width: 100%;
  height: 500px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--color-border-light);
  position: relative;
  z-index: 1;
}

/* Marcador customizado da loja */
:global(.custom-store-marker) {
  background: transparent;
  border: none;
}

:global(.store-marker-pin) {
  color: var(--color-primary);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Legenda do Mapa */
.map-legend {
  background: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.map-legend h4 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.legend-marker.store {
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  position: relative;
}

.legend-marker.store::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
}

.legend-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid;
  background: transparent;
  flex-shrink: 0;
}

/* Zonas de Entrega */
.zones-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.zone-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border-light);
  transition: all var(--transition-base);
}

.zone-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.zone-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
  box-shadow: var(--shadow-md);
}

.zone-fields {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.zone-fields .form-group {
  margin-bottom: 0;
}

.zone-fields label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.zone-fields input {
  width: 100%;
}

.zone-item .btn-delete {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  background: white;
  color: #dc2626;
  border-color: #dc2626;
  flex-shrink: 0;
}

.zone-item .btn-delete:hover {
  background: #dc2626;
  color: white;
}

/* Modal de Exclusão */
.delete-modal {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.delete-modal .modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.warning-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #fef2f2;
  border-radius: 50%;
  color: #dc2626;
}

.delete-modal .modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-content {
  padding: 1.5rem;
}

.modal-content p {
  margin: 0 0 1rem 0;
  color: #374151;
  line-height: 1.5;
}

.modal-content p:last-child {
  margin-bottom: 0;
}

.warning-text {
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-delete-confirm {
  flex: 1;
  background: #ef4444;
  color: white;
  border: 1px solid #ef4444;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-confirm:hover {
  background: #dc2626;
  border-color: #dc2626;
}

.btn-add-zone {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-add-zone:hover {
  background: var(--color-success-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-add-zone svg {
  transition: transform var(--transition-base);
}

.btn-add-zone:hover svg {
  transform: rotate(90deg);
}

/* Responsividade adicional para mapa */
@media (max-width: 768px) {
  .settings-page {
    padding: var(--spacing-lg);
    padding-bottom: 140px;
  }
  
  .delivery-map {
    height: 350px;
  }
  
  .address-input-wrapper,
  .cep-input-wrapper {
    flex-direction: column;
  }
  
  .cep-input {
    max-width: 100%;
  }
  
  .btn-geocode,
  .btn-search-cep {
    width: 100%;
    justify-content: center;
  }
  
  .address-fields-group {
    grid-template-columns: 1fr;
  }
  
  .coordinates-display {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .zone-fields {
    grid-template-columns: 1fr;
  }
  
  .mode-selector {
    grid-template-columns: 1fr;
  }
  
  .zone-item {
    flex-direction: column;
  }
  
  .zone-item .btn-delete {
    width: 100%;
    justify-content: center;
  }
  
  .delete-modal .modal-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .map-legend {
    padding: var(--spacing-lg);
  }
  
  .legend-items {
    gap: var(--spacing-sm);
  }
}

/* Color Picker Styles */
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.color-picker {
  width: 60px;
  height: 40px;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  padding: 0;
  background: none;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 0.375rem;
}

.color-input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
}

.color-input:focus {
  outline: none;
  border-color: var(--color-primary, #ff8e24);
  box-shadow: 0 0 0 3px rgba(255, 142, 36, 0.1);
}

.btn-reset-color {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-reset-color:hover {
  background: #e5e7eb;
  color: #374151;
  border-color: #9ca3af;
}

.color-preview {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.preview-item {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.preview-item:first-child {
  background-color: var(--color-primary, #ff8e24);
  color: white;
}

.preview-item:nth-child(2) {
  background: white;
  border-color: var(--color-primary, #ff8e24);
  color: var(--color-primary, #ff8e24);
}

.preview-item:last-child {
  background: white;
  color: var(--color-primary, #ff8e24);
}
</style>
