<script setup>
import { handleSelect } from '@/router.js'
import { Bottom } from '@element-plus/icons-vue'
</script>


<template>
  <!-- nav -->
  <el-menu
    class="pls-nav-top"
    mode="horizontal"
    background-color="#ffffff"
    text-color="#333333"
    active-text-color="#409EFF"
    :ellipsis="false"
    @select="handleSelect"
  >
    <!--Logo-->
    <el-menu-item index="0" class="pls-nav-top-logo">
      <img
        style="width: 50px"
        src="/src/assets/logo.svg"
        alt="logo"
      />
    </el-menu-item>
    <!--Navigation left-->
    <el-menu-item index="1" class="pls-nav-list-wrap">
      <a href="application" class="pls-nav-list-wrap-a">申请</a>
    </el-menu-item>

    <el-menu-item index="2" class="pls-nav-list-wrap">
      <a href="handle" class="pls-nav-list-wrap-a">处理</a>
    </el-menu-item>

    <el-menu-item index="3" class="pls-nav-list-wrap">
      <a href="examine1" class="pls-nav-list-wrap-a">所有方审批</a>
    </el-menu-item>

    <el-menu-item index="4" class="pls-nav-list-wrap">
      <a href="examine2" class="pls-nav-list-wrap-a">审核方审批</a>
    </el-menu-item>

    <el-menu-item index="5" class="pls-nav-list-wrap">

      <a href="usermgr" class="pls-nav-list-wrap-a">用户管理</a>
    </el-menu-item>





<!--    <el-sub-menu index="1" class="pls-nav-list-wrap">-->
<!--      <template #title>nav-1</template>-->
<!--      <el-menu-item index="1-1">l-1</el-menu-item>-->
<!--      <el-menu-item index="1-2">l-2</el-menu-item>-->
<!--      <el-menu-item index="1-3">l-3</el-menu-item>-->
<!--      <el-menu-item index="-4">l-4</el-menu-item>-->
<!--    </el-sub-menu>-->

<!--    <el-sub-menu index="2" class="pls-nav-list-wrap">-->
<!--      <template #title>nav-2</template>-->
<!--      <el-menu-item index="2-1">l-1</el-menu-item>-->
<!--      <el-menu-item index="2-2">l-2</el-menu-item>-->
<!--      <el-menu-item index="2-3">l-3</el-menu-item>-->
<!--      <el-menu-item index="2-4">l-4</el-menu-item>-->
<!--    </el-sub-menu>-->

<!--    <el-sub-menu index="3" class="pls-nav-list-wrap">-->
<!--      <template #title>nav-3</template>-->
<!--      <el-menu-item index="3-1">l-1</el-menu-item>-->
<!--      <el-menu-item index="3-2">l-2</el-menu-item>-->
<!--      <el-menu-item index="3-3">l-3</el-menu-item>-->
<!--      <el-menu-item index="3-4">l-4</el-menu-item>-->
<!--    </el-sub-menu>-->

<!--    <el-sub-menu index="4" class="pls-nav-list-wrap">-->
<!--      <template #title>nav-4</template>-->
<!--      <el-menu-item index="4-1">l-1</el-menu-item>-->
<!--      <el-menu-item index="4-2">l-2</el-menu-item>-->
<!--      <el-menu-item index="4-3">l-3</el-menu-item>-->
<!--      <el-menu-item index="4-4">l-4</el-menu-item>-->
<!--    </el-sub-menu>-->

<!--    <el-sub-menu index="5" class="pls-nav-list-wrap">-->
<!--      <template #title>nav-5</template>-->
<!--      <el-menu-item index="5-1">l-1</el-menu-item>-->
<!--      <el-menu-item index="5-2">l-2</el-menu-item>-->
<!--      <el-menu-item index="5-3">l-3</el-menu-item>-->
<!--      <el-menu-item index="5-4">l-4</el-menu-item>-->
<!--    </el-sub-menu>-->
    <!--Search-->
    <el-menu-item class="pls-nav-top-operation">
      <el-input class="pls-nav-search-wrap" suffix-icon="Search">
        <bottom>

        </bottom>
      </el-input>
    </el-menu-item>
    <!--Language-->
    <el-sub-menu index="lang" class="pls-nav-list-lang">
      <template #title>语言选择</template>
      <el-menu-item index="en">English</el-menu-item>
      <el-menu-item index="zh">简体中文</el-menu-item>
    </el-sub-menu>
    <!--login-->
    <el-menu-item class="pls-nav-top-ctrl">
      <a class="pls-nav-top-link">登录</a>
    </el-menu-item>
    <!--auth-->
    <el-menu-item>
      <a class="pls-nav-top-btn">注册</a>
    </el-menu-item>
  </el-menu>
  <!-- root -->
  <el-container id="root">
    <!-- Hero -->
    <el-header class="lz-hero" role="banner">

      <!-- Hero Main Content -->
      <div class="hero-main">
        <el-carousel trigger="click" arrow="always" style="height: 100%">

          <!-- Banner 1 -->
          <el-carousel-item>
            <!--src a-->
            <a href=" " target="_blank">
              <el-card class="banner-card">
                <div class="banner-video-wrap">
                  <!--src video-->
                  <video src="" autoplay muted loop></video>
                </div>
                <div class="banner-gradient-left"></div>
                <div class="banner-gradient-right"></div>
              </el-card>
            </a>
          </el-carousel-item>

          <!-- Banner 2 -->
          <el-carousel-item>
            <!--src a-->
            <a href="" target="_blank">
              <el-card class="banner-card">
                <div class="banner-content">
                  <h3 class="banner-title"> <!--title--> </h3>
                  <p class="banner-description"> <!--description--> </p>
<!--                  <el-button type="primary" size="large"> &lt;!&ndash;button&ndash;&gt; </el-button>-->
                </div>
              </el-card>
            </a>
          </el-carousel-item>
        </el-carousel>
      </div>
    </el-header>
    <!-- main -->
    <el-main>
      <!-- section-1 -->
      <!-- announcement -->
      <section class="lz-section">
        <div class="lz-section__inner">
          <el-card class="box-card">
            <div slot="header" class="clearfix">
              <span>动态和公告</span>
            </div>

            <!-- cards -->
            <div class="lz-Information">
              <div class="lz-Information__cards">

                <!-- 动态 -->
                <el-card class="lz-Information__card" shadow="hover" v-for="Info in Info" :key="Info.href">
                  <el-link :href="Info.href">{{ Info.name }}</el-link>
                </el-card>
                <!-- 公告 -->
                <el-card class="lz-Information__card" shadow="hover" v-for="Anno in Anno" :key="Anno.href">
                  <el-link :href="Anno.href">{{ Anno.name }}</el-link>
                </el-card>


              </div>
            </div>
          </el-card>
        </div>

      </section>
      <!-- section-2 -->
      <!-- service -->
      <section class="lz-section">
        <div class="lz-section__inner">
          <header class="lz-section__hd">
            <h2 class="lz-section__title"> <!-- h --> </h2>
            <div class="lz-section__sub">
              <span class="lz-section__desc"> <!-- description --> </span>
              <span class="lz-section__links">
<!--            <el-button type="primary" @click=" "> &lt;!&ndash; button &ndash;&gt; </el-button>-->
          </span>
            </div>
          </header>

          <div class="lz-section__bd">
            <el-tabs v-model="activeTab" type="card">
              <!-- service-tab-1 -->
              <el-tab-pane label="service-1" name="1" :key="1">
                <div class="lz-Service__detail">
                  <el-row :gutter="20">
                    <el-col :span="8" v-for="(Service, index) in recommendedServices" :key="index">
                      <el-card>
                        <div slot="header" class="clearfix">
                          <span>{{ Service.title }}</span>
                        </div>
                        <div>
                          <p>{{ Service.description }}</p>
                          <el-button type="primary" @click=" "> <!-- button --> </el-button>
                          <el-button @click=" "> <!-- button --> </el-button>
                        </div>
                      </el-card>
                    </el-col>
                  </el-row>
                </div>
              </el-tab-pane>

              <!-- service--tab-2 -->
              <el-tab-pane label="service-2" name="2" :key="2">
                <!-- Add content for service -->
              </el-tab-pane>

                <!-- Add other tab panes here -->

            </el-tabs>
          </div>
        </div>
      </section>
      <!-- section-3 -->
      <!-- data show -->
      <section class="lz-section">

      </section>
    </el-main>

  </el-container>
  <!-- footer -->
  <el-footer class="pls-footer-website">
    <el-container class="pls-footer-inner">
      <el-row :gutter="20" class="pls-footer-website-columns">
        <!-- 支持服务 -->
        <el-col :span="6">
          <el-card shadow="hover">
            <el-link type="primary" class="pls-footer-website-title">支持服务</el-link>
            <el-menu class="pls-footer-website-list">
              <el-menu-item v-for="Service in supportService" :key="Service.href">
                <el-link :href="Service.href">{{ Service.name }}</el-link>
              </el-menu-item>
            </el-menu>
          </el-card>
        </el-col>
      </el-row>
        <!-- 联系方式和二维码 -->
      <el-row class="pls-footer-website-contact" :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover">
            <h3 class="pls-footer-website-contact-title">联系我们</h3>
            <p class="pls-footer-website-contact-text">

            </p>
            <div class="pls-footer-website-contact-view">
              <img src="/src/assets/logo.svg" alt=" " />
              <img src="/src/assets/logo.svg" alt=" " />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-container>
  </el-footer>
</template>

<style lang="scss" scoped>
/* ===================== Global Styles ===================== */
body {
  margin: 0;
  padding: 0;
  font-family: 'Arial', sans-serif;
  background-color: #f8f8f8;
  color: #333;
  width: 100%;
}

/* ===================== Navbar Styles ===================== */
.pls-nav-top {
  background-color: #ffffff;
  border-bottom: 1px solid #eaeaea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 1200px; /* Fixed width for the navbar */
  margin: 0 auto; /* Center the navbar */
  transition: width 0.3s ease, padding 0.3s ease; /* Smooth transition on resize */
}

.pls-nav-top .el-menu-item {
  font-size: 16px;
  color: #333;
  transition: color 0.3s ease;
}

.pls-nav-top .el-menu-item:hover {
  color: #409EFF;
}

.pls-nav-top .pls-nav-top-logo img {
  width: 50px;
}

.pls-nav-list-wrap {
  display: inline-block;
  margin-left: 15px;
  text-decoration: none;
}

.pls-nav-list-wrap-a{
  text-decoration: none;
}

.pls-nav-top-ctrl .pls-nav-top-link,
.pls-nav-top-btn {
  font-size: 16px;
  color: #409EFF;
}

.pls-nav-top-operation .el-input {
  width: 200px;
}

.pls-nav-top-operation .el-input input {
  border-radius: 20px;
}

.pls-nav-top-operation .el-input .el-input__inner {
  padding: 10px;
}

.pls-nav-top .pls-nav-top-btn {
  background-color: #409EFF;
  color: white;
  padding: 0 20px;
  margin-left: 10px;
  transition: background-color 0.3s ease;
}

.pls-nav-top .pls-nav-top-btn:hover {
  background-color: #3381d5;
}

/* ===================== Hero Section Styles ===================== */
.lz-hero {
  position: relative;
  background-color: transparent;
  padding: 0;
  height: 36vh;
  margin-top: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 1200px; /* Fixed width for the hero section */
  margin: 0 auto; /* Center the hero section */

}

.hero-main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-carousel {
  width: 100%;
  height: 100%;
}

.el-carousel-item {
  height: 100%;
  position: relative;
}

.banner-card {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: transparent;
  overflow: hidden;
}

.banner-video-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-decoration: none;
}


.banner-video-wrap video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lz-section {
  padding-top: 50px;
  border-top: 1px solid #eaeaea;
  margin-top: 30px;
  margin-bottom: 30px;
  width: 1200px; /* Fixed width for sections */
  margin: 0 auto; /* Center the section */
}

.banner-gradient-left,
.banner-gradient-right {
  position: absolute;
  top: 0;
  height: 100%;
  width: 50px;
}

.banner-gradient-right {
  right: 0;
  left: auto;
}

.banner-gradient-left {
  left: 0;
  right: auto;
}

.el-carousel-item > .el-card {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Hero Title */
.banner-title {
  font-size: 2rem;
  color: #fff;
  text-align: center;
  margin-bottom: 1rem;
  z-index: 10;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
}

.banner-description {
  font-size: 1rem;
  color: #fff;
  text-align: center;
  margin-bottom: 1.5rem;
  z-index: 10;
}

.el-button {
  font-size: 0.9rem;
  padding: 8px 16px;
  background-color: #409EFF;
  color: #fff;
  border-radius: 5px;
  border: none;
  z-index: 10;
  transition: background-color 0.3s ease;
}

.el-button:hover {
  background-color: #3381d5;
}

/* ===================== Section Styles ===================== */
.lz-section__inner {
  padding: 16px;
  width: 1200px; /* Fixed width for section inner */
  margin: 0 auto; /* Center the inner section */
}

.lz-Information__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.lz-Information__card {
  flex: 1 1 calc(33.333% - 16px);
  margin: 8px 0;
  transition: transform 0.3s ease;
}

.lz-Information__card:hover {
  transform: translateY(-5px);
}

.lz-Information__card .el-link {
  font-size: 16px;
  color: #333;
  text-decoration: none;
}

.lz-Information__card .el-link:hover {
  color: #409EFF;
  text-decoration: underline;
}

/* ===================== Footer Styles ===================== */
.pls-footer-website {
  background-color: #f8f8f8;
  padding: 16px 0;
  border-top: 1px solid #eaeaea;
  width: 1200px; /* Fixed width for footer */
  margin: 0 auto; /* Center the footer */
}

.pls-footer-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.pls-footer-website-columns {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.pls-footer-website-columns .el-card {
  padding: 16px;
}

.pls-footer-website-contact,
.pls-footer-website-support {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pls-footer-website-contact {
  text-align: right;
}

.pls-footer-website-support {
  text-align: left;
}

.pls-footer-website-contact img,
.pls-footer-website-support img {
  width: 80px;
  margin: 8px;
}

/* ===================== Media Queries ===================== */
@media (max-width: 1024px) {
  .pls-nav-top,
  .lz-hero,
  .lz-section,
  .pls-footer-website {
    width: 960px; /* Adjust to a smaller fixed width for medium screens */
  }

  .lz-Information__card {
    flex: 1 1 calc(50% - 16px);
  }

  .lz-Information__cards {
    gap: 15px;
  }

  .pls-footer-website-columns {
    flex-direction: column;
    text-align: center;
  }

  .pls-footer-website-contact,
  .pls-footer-website-support {
    flex: 1 1 100%;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .pls-nav-top,
  .lz-hero,
  .lz-section,
  .pls-footer-website {
    width: 720px; /* Adjust to a smaller fixed width for small screens */
  }

  .lz-Information__card {
    flex: 1 1 100%;
  }

  .lz-Information__cards {
    gap: 15px;
  }

  .pls-footer-website-columns {
    flex-direction: column;
    text-align: center;
  }

  .pls-footer-website-contact,
  .pls-footer-website-support {
    flex: 1 1 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .pls-nav-top,
  .lz-hero,
  .lz-section,
  .pls-footer-website {
    width: 100%; /* Full width for very small screens */
  }

  .lz-Information__card {
    flex: 1 1 100%;
  }

  .pls-nav-top .el-menu-item {
    font-size: 14px;
  }

  .banner-title {
    font-size: 1.5rem;
  }

  .banner-description {
    font-size: 0.9rem;
  }

  .el-button {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
}


</style>

