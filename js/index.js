//系统 主入口

var viewer; //地球对象
//地图
$(document).ready(function () {
    if (!mars3d.util.webglreport()) {
        toastr.error('系统检测到您当前使用的浏览器WebGL功能无效');
        layer.open({
            type: 1,
            title: "当前浏览器WebGL功能无效",
            skin: "layer-mars-dialog animation-scale-up",
            resize: false,
            area: ['600px', '200px'], //宽高
            content: '<div style="margin: 20px;"><h3>系统检测到您使用的浏览器WebGL功能无效！</h3>  <p>1、请您检查浏览器版本，安装使用最新版chrome、火狐或IE11以上浏览器！</p> <p>2、WebGL支持取决于GPU支持，请保证客户端电脑已安装最新显卡驱动程序！</p><p>3、如果上两步骤没有解决问题，说明您的电脑需要更换了！</p></div>'
        });
    }
    initUI();
    initMap();
});

function removeMask() {
    $("#mask").remove();
}


//初始化地图
function initMap() {

    mars3d.createMap({
        id: 'cesiumContainer',
        url: "config/config.json",
        //infoBox: false,     //是否显示点击要素之后显示的信息  【也可以在config.json中配置】  
        //sceneMode: Cesium.SceneMode.SCENE2D, 
        success: function (_viewer, jsondata) {//地图成功加载完成后执行 
            //欢迎UI关闭处理
            setTimeout(removeMask, 3000);

            //记录viewer
            viewer = _viewer;

            viewer.mars.openFlyAnimation();//开场动画

            initWork(_viewer);
        }
    });
}


//UI界面相关
function initUI() {
    haoutil.oneMsg('首次访问系统无缓存会略慢，请耐心等待！', 'load3d_tip');


}


//当前页面业务相关
function initWork(viewer) {
    haoutil.oneMsg('如果未出现地球，是因为地形加载失败，请刷新重新加载！', 'terrain_tip');


    //针对不同终端的优化配置
    if (haoutil.system.isPCBroswer()) {
        // Cesium 1.61以后会默认关闭反走样，对于桌面端而言还是开启得好，
        viewer.scene.postProcessStages.fxaa.enabled = true;

        //鼠标滚轮放大的步长参数
        viewer.scene.screenSpaceCameraController._zoomFactor = 2.0;

        //IE浏览器优化
        if (window.navigator.userAgent.toLowerCase().indexOf("msie") >= 0) {
            viewer.targetFrameRate = 20;        //限制帧率
            viewer.requestRenderMode = true;    //取消实时渲染
        }

    }
    else {
        //鼠标滚轮放大的步长参数
        viewer.scene.screenSpaceCameraController._zoomFactor = 5.0;

        //移动设备上禁掉以下几个选项，可以相对更加流畅 
        viewer.requestRenderMode = true;    //取消实时渲染
        viewer.scene.fog.enable = false;
        viewer.scene.skyAtmosphere.show = false;
        viewer.scene.globe.showGroundAtmosphere = false;
    }

    // 禁用默认的实体双击动作。
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

    //二三维切换不用动画
    if (viewer.sceneModePicker)
        viewer.sceneModePicker.viewModel.duration = 0.0;


    $.ajax({
        type: "get",
        dataType: "json",
        url: 'http://data.marsgis.cn/file/apidemo/qiye/point.json',
        timeout: 0,
        success: function (data) {
            showPoint(data.Data)
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            haoutil.loading.hide();
            haoutil.alert(configfile + "文件加载失败！");
        }
    });

}


function showPoint(arrdata) {
    var dataSource = new Cesium.CustomDataSource();
    viewer.dataSources.add(dataSource);

    for (var item of arrdata) {
        var position = Cesium.Cartesian3.fromDegrees(item.JD, item.WD, 2);

        //添加实体
        var entity = dataSource.entities.add({
            name: item.JC,
            position: position,
            point: {
                //像素点
                color: Cesium.Color.fromCssColorString("#3388ff"),
                pixelSize: 10,
                outlineColor: Cesium.Color.fromCssColorString("#ffffff"),
                outlineWidth: 2,
                scaleByDistance: new Cesium.NearFarScalar(1000, 1, 1000000, 0.1)
            },
            label: {
                text: item.JC,
                font: "16px 楷体",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.AZURE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -10), //偏移量
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                    0.0,
                    200000
                )
            },
            data: item,
            popup: mars3d.util.getPopup("all", item, "企业点"),
            click: function (entity) {
                //单击回调
                haoutil.msg("您单击了：" + entity.data.JC);
            }
        });
    }

}
