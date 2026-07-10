"use strict";
/*:
* @plugindesc 战斗QTE系统 - 指示器扫过判定区域
 * @author fnyoat
 *
 * @param General Settings
 * @text 通用设置
 * @desc QTE系统的总开关
 *
 * @param enableQTE
 * @text 启用QTE系统
 * @type boolean
 * @default true
 * @parent General Settings
 *
 * @param defaultPosition
 * @text 默认QTE界面位置
 * @type select
 * @option 左侧
 * @value left
 * @option 右侧
 * @value right
 * @option 顶部
 * @value top
 * @option 底部
 * @value bottom
 * @option 中央
 * @value center
 * @default left
 * @parent General Settings
 *
 * @param baseAccuracyBonus
 * @text 基础准确度伤害加成(%)
 * @type number
 * @default 25
 * @parent General Settings
 *
 * @param minHitRate
 * @text 完全落空命中率(%)
 * @type number
 * @default 20
 * @parent General Settings
 *
 * @param hitRateExponent
 * @text 命中率曲线指数
 * @type number
 * @default 1.5
 * @min 0.1
 * @max 5.0
 * @step 0.1
 * @parent General Settings
 *
 * @param Judgment Area
 * @text 判定区域设置
 *
 * @param judgmentWidth
 * @text 判定区域宽度
 * @type number
 * @default 100
 * @parent Judgment Area
 *
 * @param judgmentHeight
 * @text 判定区域高度
 * @type number
 * @default 100
 * @parent Judgment Area
 *
 * @param judgmentColor
 * @text 判定区域颜色
 * @type string
 * @default rgba(0, 255, 0, 0.3)
 * @parent Judgment Area
 *
 * @param judgmentBorderColor
 * @text 判定区域边框颜色
 * @type string
 * @default rgba(0, 255, 0, 0.8)
 * @parent Judgment Area
 *
 * @param Visual Settings
 * @text 视觉设置
 *
 * @param fadeAfterPass
 * @text 扫过后果断虚化
 * @type boolean
 * @default true
 * @parent Visual Settings
 *
 * @param fadeOpacity
 * @text 虚化透明度
 * @type number
 * @default 0.3
 * @parent Visual Settings
 *
 * @param glowEffect
 * @text 发光效果
 * @type boolean
 * @default true
 * @parent Visual Settings
 *
 * @param glowColor
 * @text 发光颜色
 * @type string
 * @default rgba(255, 255, 255, 0.5)
 * @parent Visual Settings
 *
 * @param Sound Settings
 * @text 音效设置
 *
 * @param hitSound
 * @text 击中判定音效
 * @type file
 * @dir audio/se/
 * @default decision1
 * @parent Sound Settings
 *
 * @param missSound
 * @text 未击中音效
 * @type file
 * @dir audio/se/
 * @default buzzer1
 * @parent Sound Settings
 *
 * @param confirmSound
 * @text 按键确认音效
 * @type file
 * @dir audio/se/
 * @default decision2
 * @parent Sound Settings
 *
 * @param alertSound
 * @text 提示音
 * @type file
 * @dir audio/se/
 * @default cursor1
 * @parent Sound Settings
 *
 * @param enableAlertSound
 * @text 启用提示音
 * @type boolean
 * @default false
 * @parent Sound Settings
 *
 * @param alertInterval
 * @text 提示音间隔(帧)
 * @type number
 * @default 30
 * @parent Sound Settings
 *
 * @param perfectHitSound
 * @text 完美命中音效
 * @type file
 * @dir audio/se/
 * @default decision2
 * @parent Sound Settings
 *
 * @param Indicators
 * @text 指示器配置
 *
 * @param indicator1
 * @text 指示器1
 * @type struct<Indicator>
 * @default {"name":"确认键","key":"90","color":"rgba(255, 255, 255, 0.9)","width":"40","height":"40","speed":"10","direction":"rightToLeft","times":"1","magnetic":"true","magneticStrength":"0.3","antiMagnetic":"false","antiMagneticStrength":"0.2","accel":"0","hallucination":"false"}
 * @parent Indicators
 *
 * @param indicator2
 * @text 指示器2
 * @type struct<Indicator>
 * @default {"name":"取消键","key":"88","color":"rgba(255, 0, 0, 0.9)","width":"40","height":"40","speed":"10","direction":"rightToLeft","times":"1","magnetic":"true","magneticStrength":"0.3","antiMagnetic":"false","antiMagneticStrength":"0.2","accel":"0","hallucination":"false"}
 * @parent Indicators
 *
 * @param indicator3
 * @text 指示器3
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator4
 * @text 指示器4
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator5
 * @text 指示器5
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator6
 * @text 指示器6
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator7
 * @text 指示器7
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator8
 * @text 指示器8
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator9
 * @text 指示器9
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator10
 * @text 指示器10
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param QTE Groups
 * @text QTE组配置
 *
 * @param qteGroup1
 * @text QTE组1
 * @type struct<QTEGroup>
 * @default {"name":"确认组","indicators":"确认键","chance":"100","times":"1","direction":"rightToLeft","speed":"10","damageLink":""}
 * @parent QTE Groups
 *
 * @param qteGroup2
 * @text QTE组2
 * @type struct<QTEGroup>
 * @default {"name":"取消组","indicators":"取消键","chance":"100","times":"1","direction":"rightToLeft","speed":"10","damageLink":""}
 * @parent QTE Groups
 *
 * @param qteGroup3
 * @text QTE组3
 * @type struct<QTEGroup>
 * @default {"name":"确认取消组","indicators":"确认键,取消键","chance":"100","times":"1","direction":"rightToLeft","speed":"10","interval":"0.8","damageLink":""}
 * @parent QTE Groups
 *
 * @param qteGroup4
 * @text QTE组4
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup5
 * @text QTE组5
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup6
 * @text QTE组6
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup7
 * @text QTE组7
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup8
 * @text QTE组8
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup9
 * @text QTE组9
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup10
 * @text QTE组10
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param Default Indicators
 * @text 默认指示器设置
 *
 * @param defaultIndicatorSpeed
 * @text 默认速度
 * @type number
 * @default 4
 * @parent Default Indicators
 *
 * @param defaultIndicatorDirection
 * @text 默认方向
 * @type select
 * @option 从右往左
 * @value rightToLeft
 * @option 从左往右
 * @value leftToRight
 * @option 从上往下
 * @value topToBottom
 * @option 从下往上
 * @value bottomToTop
 * @default rightToLeft
 * @parent Default Indicators
 *
 * @param defaultIndicatorTimes
 * @text 默认扫过次数
 * @type number
 * @default 1
 * @parent Default Indicators
 *
 * @param enableMagnetic
 * @text 启用磁性效果
 * @type boolean
 * @default true
 * @parent Default Indicators
 *
 * @param magneticStrength
 * @text 磁性强度
 * @type number
 * @default 0.3
 * @parent Default Indicators
 *
 * @param enableAntiMagnetic
 * @text 启用反磁性
 * @type boolean
 * @default false
 * @parent Default Indicators
 *
 * @param antiMagneticStrength
 * @text 反磁性强度
 * @type number
 * @default 0.2
 * @parent Default Indicators
 *
 * @param acceleration
 * @text 加速度
 * @type number
 * @default 0
 * @parent Default Indicators
 *
 * @param deceleration
 * @text 减速度
 * @type number
 * @default 0
 * @parent Default Indicators
 *
 * @param Default Group
 * @text 默认QTE组设置
 *
 * @param defaultGroupIndicators
 * @text 默认指示器列表
 * @type string
 * @default 确认键,取消键
 * @parent Default Group
 *
 * @param defaultGroupChance
 * @text 默认出现概率
 * @type number
 * @default 100
 * @parent Default Group
 *
 * @param defaultGroupTimes
 * @text 默认扫过次数
 * @type number
 * @default 1
 * @parent Default Group
 *
 * @param defaultGroupSpeed
 * @text 默认速度
 * @type number
 * @default 10
 * @parent Default Group
 *
 * @param defaultGroupDirection
 * @text 默认方向
 * @type select
 * @option 从右往左
 * @value rightToLeft
 * @option 从左往右
 * @value leftToRight
 * @option 从上往下
 * @value topToBottom
 * @option 从下往上
 * @value bottomToTop
 * @default rightToLeft
 * @parent Default Group
 *
 * @param Advanced Settings
 * @text 高级配置
 *
 * @param enableAdvancedMotion
 * @text 启用高级运动
 * @type boolean
 * @default false
 * @parent Advanced Settings
 *
 * @param advancedMotionScript
 * @text 高级运动脚本
 * @type string
 * @default ""
 * @parent Advanced Settings
 *
 * @help
 * 备注标签:
 * <FNQTE_Group:x> - 启用QTE并指定组
 * <FNQTE_Dodge_Group:x> - 启用QTE躲避
 * <FNQTE_Chance:50> - 概率
 * <FNQTE_Width:100> - 宽度
 * <FNQTE_Speed:5> - 速度
 * <FNQTE_Reverse> - 反向
 * <FNQTE_Times:3> - 次数
 * <FNQTE_Magnetic:0.5> - 磁性
 * <FNQTE_Accel:0.1> - 加速度
 * <FNQTE_Hallucination> - 幻觉模式
 * <FNQTE_DamageSegments:10> - 伤害分段
 * <FNQTE_Segments_Indicators:2,3,5> - 分段指示器数量
 * <FNQTE_RealTime> - 实时模式
 * <FNQTE_NoRealTime> - 非实时模式
 *
 * 脚本调用:
 * fnyoat.QTE.start(action) - 开始QTE
 * fnyoat.QTE.stop() - 停止QTE
 * fnyoat.QTE.setActive(active) - 设置激活状态
 * fnyoat.QTE.result() - 获取结果
 *
 * 插件命令:
 * fnyoatQTE start/stop/active/inactive
 
*/
//=============================================================================
// fnyoat_BattleQTE.ts
//=============================================================================
/*:
 * @plugindesc 战斗QTE系统 - 指示器扫过判定区域
 * @author fnyoat
 *
 * @param General Settings
 * @text 通用设置
 * @desc QTE系统的总开关
 *
 * @param enableQTE
 * @text 启用QTE系统
 * @type boolean
 * @default true
 * @parent General Settings
 *
 * @param defaultPosition
 * @text 默认QTE界面位置
 * @type select
 * @option 左侧
 * @value left
 * @option 右侧
 * @value right
 * @option 顶部
 * @value top
 * @option 底部
 * @value bottom
 * @option 中央
 * @value center
 * @default left
 * @parent General Settings
 *
 * @param baseAccuracyBonus
 * @text 基础准确度伤害加成(%)
 * @type number
 * @default 25
 * @parent General Settings
 *
 * @param minHitRate
 * @text 完全落空命中率(%)
 * @type number
 * @default 20
 * @parent General Settings
 *
 * @param hitRateExponent
 * @text 命中率曲线指数
 * @type number
 * @default 1.5
 * @min 0.1
 * @max 5.0
 * @step 0.1
 * @parent General Settings
 *
 * @param Judgment Area
 * @text 判定区域设置
 *
 * @param judgmentWidth
 * @text 判定区域宽度
 * @type number
 * @default 100
 * @parent Judgment Area
 *
 * @param judgmentHeight
 * @text 判定区域高度
 * @type number
 * @default 100
 * @parent Judgment Area
 *
 * @param judgmentColor
 * @text 判定区域颜色
 * @type string
 * @default rgba(0, 255, 0, 0.3)
 * @parent Judgment Area
 *
 * @param judgmentBorderColor
 * @text 判定区域边框颜色
 * @type string
 * @default rgba(0, 255, 0, 0.8)
 * @parent Judgment Area
 *
 * @param Visual Settings
 * @text 视觉设置
 *
 * @param fadeAfterPass
 * @text 扫过后果断虚化
 * @type boolean
 * @default true
 * @parent Visual Settings
 *
 * @param fadeOpacity
 * @text 虚化透明度
 * @type number
 * @default 0.3
 * @parent Visual Settings
 *
 * @param glowEffect
 * @text 发光效果
 * @type boolean
 * @default true
 * @parent Visual Settings
 *
 * @param glowColor
 * @text 发光颜色
 * @type string
 * @default rgba(255, 255, 255, 0.5)
 * @parent Visual Settings
 *
 * @param Sound Settings
 * @text 音效设置
 *
 * @param hitSound
 * @text 击中判定音效
 * @type file
 * @dir audio/se/
 * @default decision1
 * @parent Sound Settings
 *
 * @param missSound
 * @text 未击中音效
 * @type file
 * @dir audio/se/
 * @default buzzer1
 * @parent Sound Settings
 *
 * @param confirmSound
 * @text 按键确认音效
 * @type file
 * @dir audio/se/
 * @default decision2
 * @parent Sound Settings
 *
 * @param alertSound
 * @text 提示音
 * @type file
 * @dir audio/se/
 * @default cursor1
 * @parent Sound Settings
 *
 * @param enableAlertSound
 * @text 启用提示音
 * @type boolean
 * @default false
 * @parent Sound Settings
 *
 * @param alertInterval
 * @text 提示音间隔(帧)
 * @type number
 * @default 30
 * @parent Sound Settings
 *
 * @param perfectHitSound
 * @text 完美命中音效
 * @type file
 * @dir audio/se/
 * @default decision2
 * @parent Sound Settings
 *
 * @param Indicators
 * @text 指示器配置
 *
 * @param indicator1
 * @text 指示器1
 * @type struct<Indicator>
 * @default {"name":"确认键","key":"90","color":"rgba(255, 255, 255, 0.9)","width":"40","height":"40","speed":"10","direction":"rightToLeft","times":"1","magnetic":"true","magneticStrength":"0.3","antiMagnetic":"false","antiMagneticStrength":"0.2","accel":"0","hallucination":"false"}
 * @parent Indicators
 *
 * @param indicator2
 * @text 指示器2
 * @type struct<Indicator>
 * @default {"name":"取消键","key":"88","color":"rgba(255, 0, 0, 0.9)","width":"40","height":"40","speed":"10","direction":"rightToLeft","times":"1","magnetic":"true","magneticStrength":"0.3","antiMagnetic":"false","antiMagneticStrength":"0.2","accel":"0","hallucination":"false"}
 * @parent Indicators
 *
 * @param indicator3
 * @text 指示器3
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator4
 * @text 指示器4
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator5
 * @text 指示器5
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator6
 * @text 指示器6
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator7
 * @text 指示器7
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator8
 * @text 指示器8
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator9
 * @text 指示器9
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param indicator10
 * @text 指示器10
 * @type struct<Indicator>
 * @default {}
 * @parent Indicators
 *
 * @param QTE Groups
 * @text QTE组配置
 *
 * @param qteGroup1
 * @text QTE组1
 * @type struct<QTEGroup>
 * @default {"name":"确认组","indicators":"确认键","chance":"100","times":"1","direction":"rightToLeft","speed":"10","damageLink":""}
 * @parent QTE Groups
 *
 * @param qteGroup2
 * @text QTE组2
 * @type struct<QTEGroup>
 * @default {"name":"取消组","indicators":"取消键","chance":"100","times":"1","direction":"rightToLeft","speed":"10","damageLink":""}
 * @parent QTE Groups
 *
 * @param qteGroup3
 * @text QTE组3
 * @type struct<QTEGroup>
 * @default {"name":"确认取消组","indicators":"确认键,取消键","chance":"100","times":"1","direction":"rightToLeft","speed":"10","interval":"0.8","damageLink":""}
 * @parent QTE Groups
 *
 * @param qteGroup4
 * @text QTE组4
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup5
 * @text QTE组5
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup6
 * @text QTE组6
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup7
 * @text QTE组7
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup8
 * @text QTE组8
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup9
 * @text QTE组9
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param qteGroup10
 * @text QTE组10
 * @type struct<QTEGroup>
 * @default {}
 * @parent QTE Groups
 *
 * @param Default Indicators
 * @text 默认指示器设置
 *
 * @param defaultIndicatorSpeed
 * @text 默认速度
 * @type number
 * @default 4
 * @parent Default Indicators
 *
 * @param defaultIndicatorDirection
 * @text 默认方向
 * @type select
 * @option 从右往左
 * @value rightToLeft
 * @option 从左往右
 * @value leftToRight
 * @option 从上往下
 * @value topToBottom
 * @option 从下往上
 * @value bottomToTop
 * @default rightToLeft
 * @parent Default Indicators
 *
 * @param defaultIndicatorTimes
 * @text 默认扫过次数
 * @type number
 * @default 1
 * @parent Default Indicators
 *
 * @param enableMagnetic
 * @text 启用磁性效果
 * @type boolean
 * @default true
 * @parent Default Indicators
 *
 * @param magneticStrength
 * @text 磁性强度
 * @type number
 * @default 0.3
 * @parent Default Indicators
 *
 * @param enableAntiMagnetic
 * @text 启用反磁性
 * @type boolean
 * @default false
 * @parent Default Indicators
 *
 * @param antiMagneticStrength
 * @text 反磁性强度
 * @type number
 * @default 0.2
 * @parent Default Indicators
 *
 * @param acceleration
 * @text 加速度
 * @type number
 * @default 0
 * @parent Default Indicators
 *
 * @param deceleration
 * @text 减速度
 * @type number
 * @default 0
 * @parent Default Indicators
 *
 * @param Default Group
 * @text 默认QTE组设置
 *
 * @param defaultGroupIndicators
 * @text 默认指示器列表
 * @type string
 * @default 确认键,取消键
 * @parent Default Group
 *
 * @param defaultGroupChance
 * @text 默认出现概率
 * @type number
 * @default 100
 * @parent Default Group
 *
 * @param defaultGroupTimes
 * @text 默认扫过次数
 * @type number
 * @default 1
 * @parent Default Group
 *
 * @param defaultGroupSpeed
 * @text 默认速度
 * @type number
 * @default 10
 * @parent Default Group
 *
 * @param defaultGroupDirection
 * @text 默认方向
 * @type select
 * @option 从右往左
 * @value rightToLeft
 * @option 从左往右
 * @value leftToRight
 * @option 从上往下
 * @value topToBottom
 * @option 从下往上
 * @value bottomToTop
 * @default rightToLeft
 * @parent Default Group
 *
 * @param Advanced Settings
 * @text 高级配置
 *
 * @param enableAdvancedMotion
 * @text 启用高级运动
 * @type boolean
 * @default false
 * @parent Advanced Settings
 *
 * @param advancedMotionScript
 * @text 高级运动脚本
 * @type string
 * @default ""
 * @parent Advanced Settings
 *
 * @help
 * 备注标签:
 * <FNQTE_Group:x> - 启用QTE并指定组
 * <FNQTE_Dodge_Group:x> - 启用QTE躲避
 * <FNQTE_Chance:50> - 概率
 * <FNQTE_Width:100> - 宽度
 * <FNQTE_Speed:5> - 速度
 * <FNQTE_Reverse> - 反向
 * <FNQTE_Times:3> - 次数
 * <FNQTE_Magnetic:0.5> - 磁性
 * <FNQTE_Accel:0.1> - 加速度
 * <FNQTE_Hallucination> - 幻觉模式
 * <FNQTE_DamageSegments:10> - 伤害分段
 * <FNQTE_Segments_Indicators:2,3,5> - 分段指示器数量
 * <FNQTE_RealTime> - 实时模式
 * <FNQTE_NoRealTime> - 非实时模式
 *
 * 脚本调用:
 * fnyoat.QTE.start(action) - 开始QTE
 * fnyoat.QTE.stop() - 停止QTE
 * fnyoat.QTE.setActive(active) - 设置激活状态
 * fnyoat.QTE.result() - 获取结果
 *
 * 插件命令:
 * fnyoatQTE start/stop/active/inactive
 */
/*~struct~Indicator:
 * @param name
 * @text 指示器名称
 * @type string
 * @default 指示器
 *
 * @param key
 * @text 按键键值
 * @type number
 * @default 90
 *
 * @param color
 * @text 指示器颜色
 * @type string
 * @default rgba(255, 255, 255, 0.9)
 *
 * @param width
 * @text 宽度
 * @type number
 * @default 60
 *
 * @param height
 * @text 高度
 * @type number
 * @default 80
 *
 * @param speed
 * @text 速度
 * @type number
 * @default 10
 *
 * @param direction
 * @text 移动方向
 * @type select
 * @option 从右往左
 * @value rightToLeft
 * @option 从左往右
 * @value leftToRight
 * @option 从上往下
 * @value topToBottom
 * @option 从下往上
 * @value bottomToTop
 * @default rightToLeft
 *
 * @param times
 * @text 扫过次数
 * @type number
 * @default 1
 *
 * @param magnetic
 * @text 启用磁性
 * @type boolean
 * @default true
 *
 * @param magneticStrength
 * @text 磁性强度
 * @type number
 * @default 0.3
 *
 * @param antiMagnetic
 * @text 启用反磁性
 * @type boolean
 * @default false
 *
 * @param antiMagneticStrength
 * @text 反磁性强度
 * @type number
 * @default 0.2
 *
 * @param accel
 * @text 加速度
 * @type number
 * @default 0
 *
 * @param hallucination
 * @text 幻觉模式
 * @type boolean
 * @default false
 */
/*~struct~QTEGroup:
 * @param name
 * @text 组名称
 * @type string
 * @default QTE组
 *
 * @param indicators
 * @text 包含的指示器
 * @type string
 * @default 确认键,取消键
 *
 * @param chance
 * @text 出现概率
 * @type number
 * @default 100
 *
 * @param times
 * @text 扫过次数
 * @type number
 * @default 1
 *
 * @param direction
 * @text 移动方向
 * @type select
 * @option 从右往左
 * @value rightToLeft
 * @option 从左往右
 * @value leftToRight
 * @option 从上往下
 * @value topToBottom
 * @option 从下往上
 * @value bottomToTop
 * @default rightToLeft
 *
 * @param speed
 * @text 移动速度
 * @type number
 * @default 10
 *
 * @param interval
 * @text 指示器间隔时间(秒)
 * @type number
 * @default 0
 *
 * @param damageLink
 * @text 伤害链接(已废弃)
 * @type string
 * @default
 */
Imported = Imported || {};
Imported.fnyoat_BattleQTE = true;
window.fnyoat = window.fnyoat || {};
fnyoat.QTE = fnyoat.QTE || {};
fnyoat.QTE.parameters = PluginManager.parameters('fnyoat_BattleQTE');
if (!Imported.fnyoat_CorePhysics) {
    fnyoat.PhysicsObject = function (x = 0, y = 0, config = {}) {
        this.x = x;
        this.y = y;
        this.velX = config.velX !== undefined ? config.velX : 0;
        this.velY = config.velY !== undefined ? config.velY : 0;
        this.rotation = 0;
        this.rotationVel = config.rotationVel !== undefined ? config.rotationVel : 0;
        this.gravity = config.gravity !== undefined ? config.gravity : 0.4;
        this.friction = config.friction !== undefined ? config.friction : 0.98;
        this.rotationFriction = config.rotationFriction !== undefined ? config.rotationFriction : 0.99;
        this.opacity = 1;
        this.fadeProgress = 0;
        this.fadeRate = config.fadeRate !== undefined ? config.fadeRate : 0.015;
    };
    fnyoat.PhysicsObject.prototype.update = function () {
        this.velY += this.gravity;
        this.x += this.velX;
        this.y += this.velY;
        this.velX *= this.friction;
        this.rotationVel *= this.rotationFriction;
        this.rotation += this.rotationVel;
        this.fadeProgress += this.fadeRate;
        this.opacity = Math.max(0, 1 - this.fadeProgress);
    };
    fnyoat.PhysicsObject.prototype.getCurrentX = function () { return this.x; };
    fnyoat.PhysicsObject.prototype.getCurrentY = function () { return this.y; };
    fnyoat.PhysicsObject.prototype.getOpacity = function () { return Math.floor(this.opacity * 255); };
    fnyoat.PhysicsObject.prototype.isGone = function () { return this.fadeProgress >= 1; };
}
(function () {
    fnyoat.QTE._active = true;
    fnyoat.QTE._result = null;
    fnyoat.QTE._currentAction = null;
    fnyoat.QTE._indicators = [];
    fnyoat.QTE._groups = {};
    fnyoat.QTE._indicatorConfigs = {};
    fnyoat.QTE._processing = false;
    fnyoat.QTE._isDodge = false;
    fnyoat.QTE._realTimeMode = false;
    fnyoat.QTE._stars = [];
    fnyoat.QTE._sprites = null;
    fnyoat.QTE._judgmentArea = null;
    fnyoat.QTE._activeIndicatorIndex = 0;
    fnyoat.QTE._waitTimer = 0;
    fnyoat.QTE._handlingKey = false;
    fnyoat.QTE._perfectHitFlash = 0;
    fnyoat.QTE._started = false;
    fnyoat.QTE._indicatorInterval = 0;
    fnyoat.QTE._intervalTimer = 0;
    fnyoat.QTE._waitingForNext = false;
    fnyoat.QTE._cleaningUp = false;
    fnyoat.QTE._judgmentFadeProgress = 0;
    fnyoat.QTE._alertTimer = 0;
    fnyoat.QTE.initParams = function () {
        this._params = {
            enableQTE: this.getParam('enableQTE') === 'true',
            defaultPosition: this.getParam('defaultPosition') || 'left',
            baseAccuracyBonus: Number(this.getParam('baseAccuracyBonus')) || 25,
            minHitRate: Number(this.getParam('minHitRate')) || 20,
            hitRateExponent: Number(this.getParam('hitRateExponent')) || 1.5,
            judgmentWidth: Number(this.getParam('judgmentWidth')) || 60,
            judgmentHeight: Number(this.getParam('judgmentHeight')) || 60,
            judgmentColor: this.getParam('judgmentColor') || 'rgba(0, 255, 0, 0.3)',
            judgmentBorderColor: this.getParam('judgmentBorderColor') || 'rgba(0, 255, 0, 0.8)',
            fadeAfterPass: this.getParam('fadeAfterPass') === 'true',
            fadeOpacity: Number(this.getParam('fadeOpacity')) || 0.3,
            glowEffect: this.getParam('glowEffect') === 'true',
            glowColor: this.getParam('glowColor') || 'rgba(255, 255, 255, 0.5)',
            hitSound: this.getParam('hitSound') || 'decision1',
            missSound: this.getParam('missSound') || 'buzzer1',
            confirmSound: this.getParam('confirmSound') || 'decision2',
            perfectHitSound: this.getParam('perfectHitSound') || 'decision2',
            alertSound: this.getParam('alertSound') || 'cursor1',
            enableAlertSound: this.getParam('enableAlertSound') === 'true' || false,
            alertInterval: Number(this.getParam('alertInterval')) || 30,
            defaultSpeed: Number(this.getParam('defaultIndicatorSpeed')) || 10,
            defaultDirection: this.getParam('defaultIndicatorDirection') || 'rightToLeft',
            defaultTimes: Number(this.getParam('defaultIndicatorTimes')) || 1,
            enableMagnetic: this.getParam('enableMagnetic') === 'true',
            magneticStrength: Number(this.getParam('magneticStrength')) || 0.3,
            enableAntiMagnetic: this.getParam('enableAntiMagnetic') === 'true',
            antiMagneticStrength: Number(this.getParam('antiMagneticStrength')) || 0.2,
            acceleration: Number(this.getParam('acceleration')) || 0,
            deceleration: Number(this.getParam('deceleration')) || 0,
            defaultGroupIndicators: this.getParam('defaultGroupIndicators') || '确认键,取消键',
            defaultGroupChance: Number(this.getParam('defaultGroupChance')) || 100,
            defaultGroupTimes: Number(this.getParam('defaultGroupTimes')) || 1,
            defaultGroupSpeed: Number(this.getParam('defaultGroupSpeed')) || 10,
            defaultGroupDirection: this.getParam('defaultGroupDirection') || 'rightToLeft',
            enableAdvancedMotion: this.getParam('enableAdvancedMotion') === 'true',
            advancedMotionScript: this.getParam('advancedMotionScript') || ''
        };
        this.loadIndicatorConfigs();
        this.loadGroupConfigs();
    };
    fnyoat.QTE.getParam = function (name) {
        return fnyoat.QTE.parameters[name];
    };
    fnyoat.QTE.loadIndicatorConfigs = function () {
        this._indicatorConfigs = {};
        for (let i = 1; i <= 10; i++) {
            const paramKey = 'indicator' + i;
            const paramStr = this.getParam(paramKey);
            if (!paramStr || paramStr === '{}' || paramStr.length < 10)
                continue;
            try {
                const config = JSON.parse(paramStr);
                if (config.name && config.key) {
                    config.key = Number(config.key) || 90;
                    config.width = Number(config.width) || 60;
                    config.height = Number(config.height) || 80;
                    config.speed = Number(config.speed) || this._params.defaultSpeed;
                    config.direction = config.direction || this._params.defaultDirection;
                    config.times = Number(config.times) || this._params.defaultTimes;
                    config.magnetic = config.magnetic === 'true' || config.magnetic === true;
                    config.magneticStrength = Number(config.magneticStrength) || this._params.magneticStrength;
                    config.antiMagnetic = config.antiMagnetic === 'true' || config.antiMagnetic === true;
                    config.antiMagneticStrength = Number(config.antiMagneticStrength) || this._params.antiMagneticStrength;
                    config.accel = Number(config.accel) || 0;
                    config.hallucination = config.hallucination === 'true' || config.hallucination === true;
                    this._indicatorConfigs[config.name] = config;
                }
            }
            catch (e) {
                console.warn('fnyoat_BattleQTE: 解析指示器配置失败', paramKey, e);
            }
        }
        if (Object.keys(this._indicatorConfigs).length === 0) {
            this._indicatorConfigs['确认键'] = {
                name: '确认键', key: 90, color: 'rgba(255, 255, 255, 0.9)',
                width: 40, height: 40, speed: 4, direction: 'rightToLeft', times: 1,
                magnetic: true, magneticStrength: 0.3, antiMagnetic: false, antiMagneticStrength: 0.2,
                accel: 0, hallucination: false
            };
            this._indicatorConfigs['取消键'] = {
                name: '取消键', key: 88, color: 'rgba(255, 0, 0, 0.9)',
                width: 40, height: 40, speed: 4, direction: 'rightToLeft', times: 1,
                magnetic: true, magneticStrength: 0.3, antiMagnetic: false, antiMagneticStrength: 0.2,
                accel: 0, hallucination: false
            };
        }
    };
    fnyoat.QTE.loadGroupConfigs = function () {
        this._groups = {};
        for (let i = 1; i <= 10; i++) {
            const paramKey = 'qteGroup' + i;
            const paramStr = this.getParam(paramKey);
            if (!paramStr || paramStr === '{}' || paramStr.length < 10)
                continue;
            try {
                const config = JSON.parse(paramStr);
                if (config.name) {
                    config.indicators = config.indicators || this._params.defaultGroupIndicators;
                    config.chance = Number(config.chance) || 100;
                    config.times = Number(config.times) || 1;
                    config.speed = Number(config.speed) || this._params.defaultGroupSpeed;
                    config.direction = config.direction || this._params.defaultGroupDirection;
                    config.interval = Number(config.interval) || 0;
                    config.damageLink = config.damageLink || '';
                    this._groups[config.name] = config;
                    this._groups[i] = config;
                }
            }
            catch (e) {
                console.warn('fnyoat_BattleQTE: 解析QTE组配置失败', paramKey, e);
            }
        }
        if (Object.keys(this._groups).length === 0) {
            this._groups['默认组'] = { name: '默认组', indicators: '确认键,取消键', chance: 100, times: 1, speed: 4, direction: 'rightToLeft', damageLink: '' };
            this._groups[1] = this._groups['默认组'];
        }
    };
    fnyoat.QTE.registerIndicator = function (config) {
        if (!config.name || !config.key) {
            console.warn('fnyoat_BattleQTE: 注册指示器需要名称和按键');
            return false;
        }
        config.key = Number(config.key) || 90;
        config.width = Number(config.width) || this._params.defaultSpeed;
        config.height = Number(config.height) || 80;
        config.speed = Number(config.speed) || this._params.defaultSpeed;
        config.direction = config.direction || this._params.defaultDirection;
        config.times = Number(config.times) || 1;
        config.magnetic = config.magnetic !== false;
        config.magneticStrength = Number(config.magneticStrength) || this._params.magneticStrength;
        config.antiMagnetic = config.antiMagnetic === true;
        config.antiMagneticStrength = Number(config.antiMagneticStrength) || this._params.antiMagneticStrength;
        config.accel = Number(config.accel) || 0;
        config.hallucination = config.hallucination === true;
        config.color = config.color || 'rgba(255, 255, 255, 0.9)';
        this._indicatorConfigs[config.name] = config;
        return true;
    };
    fnyoat.QTE.registerGroup = function (config) {
        if (!config.name) {
            console.warn('fnyoat_BattleQTE: 注册QTE组需要名称');
            return false;
        }
        config.chance = Number(config.chance) || 100;
        config.times = Number(config.times) || 1;
        config.speed = Number(config.speed) || this._params.defaultGroupSpeed;
        config.direction = config.direction || this._params.defaultGroupDirection;
        config.damageLink = config.damageLink || '';
        this._groups[config.name] = config;
        return true;
    };
    fnyoat.QTE.getIndicator = function (name) { return this._indicatorConfigs[name]; };
    fnyoat.QTE.getGroup = function (nameOrId) {
        if (typeof nameOrId === 'number') {
            return this._groups[nameOrId];
        }
        return this._groups[nameOrId];
    };
    fnyoat.QTE.getWeaponAutoGroup = function (subject) {
        if (!subject || !subject.isActor())
            return null;
        const weapons = subject.weapons();
        for (let i = 0; i < weapons.length; i++) {
            const weapon = weapons[i];
            if (weapon && weapon.note) {
                const match = weapon.note.match(/<FNQTE_AutoGroup:(\d+)>/);
                if (match) {
                    return parseInt(match[1], 10);
                }
            }
        }
        return null;
    };
    fnyoat.QTE._checkGroupTag = function (note, subject) {
        let numMatch = note.match(/<FNQTE_Group:(\d+)>/);
        if (numMatch) {
            return { enabled: true, note: note };
        }
        let autoMatch = note.match(/<FNQTE_Group:auto>/i);
        if (autoMatch) {
            const autoGroup = this.getWeaponAutoGroup(subject);
            if (autoGroup) {
                const newNote = note.replace(/<FNQTE_Group:auto>/i, '<FNQTE_Group:' + autoGroup + '>');
                return { enabled: true, note: newNote };
            }
            return { enabled: false, note: note };
        }
        let forceMatch = note.match(/<FNQTE_Group:forceauto>/i);
        if (forceMatch) {
            const autoGroup = this.getWeaponAutoGroup(subject);
            if (autoGroup) {
                const newNote = note.replace(/<FNQTE_Group:forceauto>/i, '<FNQTE_Group:' + autoGroup + '>');
                return { enabled: true, note: newNote };
            }
            else {
                const newNote = note.replace(/<FNQTE_Group:forceauto>/i, '<FNQTE_Group:1>');
                return { enabled: true, note: newNote };
            }
        }
        return { enabled: false, note: note };
    };
    fnyoat.QTE.initParams();
    fnyoat.QTE.Indicator = function (config) {
        this.name = config.name || '指示器';
        this.key = config.key || 90;
        this.color = config.color || 'rgba(255, 255, 255, 0.9)';
        this.width = config.width || 40;
        this.height = config.height || 40;
        this.speed = config.speed || 10;
        this.direction = config.direction || 'rightToLeft';
        this.times = config.times || 1;
        this.magnetic = config.magnetic !== false;
        this.magneticStrength = config.magneticStrength || 0.3;
        this.antiMagnetic = config.antiMagnetic === true;
        this.antiMagneticStrength = config.antiMagneticStrength || 0.2;
        this.accel = config.accel || 0;
        this.hallucination = config.hallucination === true;
        this.advancedMotion = config.advancedMotion || null;
        this.damageLink = config.damageLink || null;
        this.segment = config.segment || 0;
        this.x = 0;
        this.y = 0;
        this.currentSpeed = this.speed;
        this.currentTime = 0;
        this.currentTimes = 0;
        this.passed = false;
        this.hit = false;
        this.accuracy = 0;
        this.hitType = null;
        this.fadeProgress = 0;
        this.fadeSpeed = 0.15;
        this.fadeDirection = 0;
        this.sprite = null;
        this.reversed = false;
        this.active = false;
        this.physics = null;
    };
    fnyoat.QTE.Indicator.prototype.update = function (judgmentArea) {
        if (this.hallucination)
            return;
        if (this.physics) {
            this.physics.update();
            this.x = this.physics.getCurrentX();
            this.y = this.physics.getCurrentY();
            this.sprite.x = this.x - this.width / 2;
            this.sprite.y = this.y - this.height / 2;
            this.sprite.opacity = this.physics.getOpacity();
            this.sprite.rotation = this.physics.rotation;
            if (this.hitType === 'perfect') {
                this.applyPerfectColor();
            }
            if (this.physics.isGone()) {
                this.physics = null;
            }
            else {
                return;
            }
        }
        if (!this.active || this.hit || this.passed) {
            return;
        }
        if (fnyoat.QTE._startDelay && fnyoat.QTE._startDelay > 0) {
            return;
        }
        if (this.advancedMotion && fnyoat.QTE._params.enableAdvancedMotion) {
            this.updateAdvancedMotion();
        }
        else {
            this.updateNormalMotion(judgmentArea);
        }
        this.checkPassed(judgmentArea);
        this.currentTime++;
    };
    fnyoat.QTE.Indicator.prototype.startFadeIn = function () {
        this.fadeProgress = 0;
        this.fadeDirection = 1;
        this.active = true;
    };
    fnyoat.QTE.Indicator.prototype.startFadeOut = function () {
        this.fadeProgress = 0;
        this.fadeDirection = -1;
        this.active = false;
        if (this.hitType === 'miss') {
            this.physics = new fnyoat.PhysicsObject(this.x, this.y, {
                velX: -(1.5 + Math.random() * 2.5), velY: 1.5,
                rotationVel: -(0.02 + Math.random() * 0.03), gravity: 0.4,
                friction: 0.98, rotationFriction: 0.99, fadeRate: 0.04
            });
        }
        else if (this.hitType === 'success' || this.hitType === 'perfect') {
            const sign = Math.random() > 0.5 ? 1 : -1;
            this.physics = new fnyoat.PhysicsObject(this.x, this.y, {
                velX: sign * (0.8 + Math.random() * 1.5), velY: -8.8,
                rotationVel: sign * (0.015 + Math.random() * 0.025), gravity: 0.4,
                friction: 0.98, rotationFriction: 0.99, fadeRate: 0.035
            });
        }
    };
    fnyoat.QTE.Indicator.prototype.updateNormalMotion = function (judgmentArea) {
        const targetX = judgmentArea.x + judgmentArea.width / 2;
        const distance = Math.abs(this.x - targetX);
        let speedMod = 1;
        if (this.magnetic && distance < 150) {
            speedMod *= (1 - this.magneticStrength * (1 - distance / 150));
        }
        if (this.antiMagnetic && distance < 100) {
            speedMod *= (1 + this.antiMagneticStrength * (1 - distance / 100));
        }
        this.currentSpeed += this.accel;
        this.currentSpeed = Math.max(1, Math.min(this.currentSpeed, this.speed * 2));
        const actualSpeed = this.currentSpeed * speedMod;
        switch (this.direction) {
            case 'rightToLeft':
                this.x -= actualSpeed * (this.reversed ? -1 : 1);
                break;
            case 'leftToRight':
                this.x += actualSpeed * (this.reversed ? -1 : 1);
                break;
            case 'topToBottom':
                this.y += actualSpeed * (this.reversed ? -1 : 1);
                break;
            case 'bottomToTop':
                this.y -= actualSpeed * (this.reversed ? -1 : 1);
                break;
        }
    };
    fnyoat.QTE.Indicator.prototype.updateAdvancedMotion = function () {
        if (typeof this.advancedMotion === 'function') {
            this.advancedMotion(this, this.currentTime);
        }
    };
    fnyoat.QTE.Indicator.prototype.checkPassed = function (judgmentArea) {
        if (this.passed)
            return;
        const centerX = this.x;
        const judgeLeft = judgmentArea.x;
        const judgeRight = judgmentArea.x + judgmentArea.width;
        switch (this.direction) {
            case 'rightToLeft':
                if (!this.reversed && centerX < judgeLeft - this.width) {
                    this.handlePass();
                }
                else if (this.reversed && centerX > judgeRight + this.width) {
                    this.handlePass();
                }
                break;
            case 'leftToRight':
                if (!this.reversed && centerX > judgeRight + this.width) {
                    this.handlePass();
                }
                else if (this.reversed && centerX < judgeLeft - this.width) {
                    this.handlePass();
                }
                break;
        }
    };
    fnyoat.QTE.Indicator.prototype.handlePass = function () {
        this.currentTimes++;
        if (this.currentTimes >= this.times) {
            if (!this.hitType) {
                this.hitType = 'miss';
            }
            this.passed = true;
            this.startFadeOut();
        }
        else {
            this.resetPosition();
        }
    };
    fnyoat.QTE.Indicator.prototype.resetPosition = function () {
        switch (this.direction) {
            case 'rightToLeft':
                this.x = this.reversed ? -this.width / 2 : Graphics.width + this.width / 2;
                break;
            case 'leftToRight':
                this.x = this.reversed ? Graphics.width + this.width / 2 : -this.width / 2;
                break;
        }
        this.currentTime = 0;
        this.currentSpeed = this.speed;
    };
    fnyoat.QTE.Indicator.prototype.applyPerfectColor = function () {
        if (this.sprite && this.sprite.bitmap) {
            const bitmap = this.sprite.bitmap;
            const w = this.width;
            const h = this.height;
            bitmap.fillRect(0, 0, w, h, 'rgba(255, 215, 0, 0.9)');
            const ctx = bitmap.context;
            ctx.strokeStyle = 'rgba(255, 255, 100, 1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, w, h);
            bitmap.fillRect(2, 2, w - 4, h - 4, 'rgba(255, 255, 200, 0.5)');
        }
    };
    fnyoat.QTE.Indicator.prototype.calculateAccuracy = function (judgmentArea) {
        if (this.passed)
            return 0;
        const centerX = this.x;
        const centerY = this.y;
        const judgeCenterX = judgmentArea.x + judgmentArea.width / 2;
        const judgeCenterY = judgmentArea.y + judgmentArea.height / 2;
        const judgeHalfWidth = judgmentArea.width / 2;
        const judgeHalfHeight = judgmentArea.height / 2;
        const dx = Math.abs(centerX - judgeCenterX);
        const dy = Math.abs(centerY - judgeCenterY);
        if (dx > judgeHalfWidth || dy > judgeHalfHeight) {
            return 0;
        }
        const normalizedX = dx / judgeHalfWidth;
        const normalizedY = dy / judgeHalfHeight;
        const distanceRatio = Math.max(normalizedX, normalizedY);
        const accuracy = 100 - (distanceRatio * 40);
        return Math.min(100, Math.max(60, accuracy));
    };
    fnyoat.QTE.Indicator.prototype.checkHit = function (judgmentArea) {
        if (this.passed || this.hit)
            return false;
        this.accuracy = this.calculateAccuracy(judgmentArea);
        if (this.accuracy <= 0) {
            this.hit = false;
            this.hitType = 'miss';
            return false;
        }
        if (this.accuracy >= 95) {
            this.hit = true;
            this.hitType = 'perfect';
            return true;
        }
        this.hit = true;
        this.hitType = 'success';
        return true;
    };
    fnyoat.QTE.StarParticle = function (x, y) {
        this.x = x;
        this.y = y;
        this.size = 6 + Math.random() * 5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.physics = new fnyoat.PhysicsObject(x, y, {
            velX: (Math.random() - 0.5) * 6, velY: -6 - Math.random() * 4,
            rotationVel: this.rotationSpeed, gravity: 0.35, friction: 0.98,
            rotationFriction: 0.99, fadeRate: 0.0125
        });
        this.opacity = 1;
        this.gone = false;
    };
    fnyoat.QTE.StarParticle.prototype.update = function () {
        if (this.gone)
            return;
        this.physics.update();
        this.x = this.physics.getCurrentX();
        this.y = this.physics.getCurrentY();
        this.rotation = this.physics.rotation;
        this.opacity = this.physics.getOpacity() / 255;
        this.gone = this.physics.isGone();
    };
    fnyoat.QTE.StarParticle.prototype.draw = function (bitmap) {
        if (this.gone)
            return;
        const cx = this.x;
        const cy = this.y;
        const r = this.size;
        const fillColor = 'rgba(255, 215, 0, ' + this.opacity + ')';
        const strokeColor = 'rgba(255, 255, 150, ' + this.opacity + ')';
        const ctx = bitmap.context;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation);
        this.drawStar(ctx, 0, 0, r, r * 0.5, 5, fillColor, strokeColor);
        ctx.restore();
    };
    fnyoat.QTE.StarParticle.prototype.drawStar = function (ctx, cx, cy, outerR, innerR, points, fillColor, strokeColor) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI / points) - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            }
            else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    };
    fnyoat.QTE.JudgmentArea = function () {
        this.x = 0;
        this.y = 0;
        this.width = fnyoat.QTE._params.judgmentWidth;
        this.height = fnyoat.QTE._params.judgmentHeight;
        this.color = fnyoat.QTE._params.judgmentColor;
        this.borderColor = fnyoat.QTE._params.judgmentBorderColor;
    };
    fnyoat.QTE.start = function (action) {
        const enableQTE = (this._params.enableQTE === true || this._params.enableQTE === 'true');
        if (!enableQTE || !this._active)
            return false;
        if (this._processing)
            return false;
        if (!action)
            return false;
        this.stop();
        this._lastAction = action;
        this._stars = [];
        this._currentAction = action;
        this._result = { success: false, accuracy: 0, hitCount: 0, totalCount: 0, damageBonus: 0, hitRateMod: 1 };
        const item = action.item();
        if (!item)
            return false;
        const qteData = this.parseQteData(action, item);
        if (!qteData.enabled)
            return false;
        if (qteData.chance < 100 && Math.randomInt(100) >= qteData.chance) {
            return false;
        }
        this._indicators = this.createIndicators(qteData);
        if (this._indicators.length === 0)
            return false;
        this._result.totalCount = this._indicators.length;
        this._isDodge = qteData.isDodge || false;
        this._realTimeMode = qteData.realTimeMode || false;
        this._indicatorInterval = qteData.interval || 0;
        this._intervalTimer = 0;
        this.setupJudgmentArea();
        this.initIndicatorPositions();
        this.createSprites();
        this._activeIndicatorIndex = 0;
        this._waitTimer = 0;
        this._perfectHitFlash = 0;
        this._processing = true;
        this._started = true;
        this._startDelay = 2;
        if (this._indicators.length > 0) {
            this._indicators[0].sprite.opacity = 255;
            this._indicators[0].fadeProgress = 1;
            this._indicators[0].active = true;
        }
        return true;
    };
    fnyoat.QTE.initIndicatorPositions = function () {
        this._indicators.forEach(function (indicator) {
            switch (indicator.direction) {
                case 'rightToLeft':
                    indicator.x = Graphics.width + indicator.width / 2;
                    break;
                case 'leftToRight':
                    indicator.x = -indicator.width / 2;
                    break;
                case 'topToBottom':
                    indicator.y = -indicator.height / 2;
                    break;
                case 'bottomToTop':
                    indicator.y = Graphics.height + indicator.height / 2;
                    break;
            }
            indicator.y = this._judgmentArea.y + this._judgmentArea.height / 2;
        }, this);
    };
    fnyoat.QTE.parseQteData = function (action, item) {
        let note = '';
        let enabled = false;
        let isDodge = false;
        const subject = action.subject();
        const isAttackAction = action.isAttack();
        if (isAttackAction && subject && subject.isActor()) {
            if (subject.actor() && subject.actor().note) {
                note = subject.actor().note;
                const result = this._checkGroupTag(note, subject);
                if (result.enabled) {
                    note = result.note;
                    enabled = true;
                }
            }
            if (!enabled && subject.currentClass() && subject.currentClass().note) {
                note = subject.currentClass().note;
                const result = this._checkGroupTag(note, subject);
                if (result.enabled) {
                    note = result.note;
                    enabled = true;
                }
            }
            if (!enabled) {
                const armors = subject.armors();
                for (let i = 0; i < armors.length; i++) {
                    const armor = armors[i];
                    if (armor && armor.note) {
                        note = armor.note;
                        const result = this._checkGroupTag(note, subject);
                        if (result.enabled) {
                            note = result.note;
                            enabled = true;
                            break;
                        }
                    }
                }
            }
            if (!enabled) {
                const weapons = subject.weapons();
                for (let i = 0; i < weapons.length; i++) {
                    const weapon = weapons[i];
                    if (weapon && weapon.note) {
                        note = weapon.note;
                        const result = this._checkGroupTag(note, subject);
                        if (result.enabled) {
                            note = result.note;
                            enabled = true;
                            break;
                        }
                    }
                }
            }
            if (!enabled && item && item.note) {
                note = item.note;
                if (note.match(/<FNQTE_Group:(\d+)>/)) {
                    enabled = true;
                }
                if (note.match(/<FNQTE_Dodge_Group:(\d+)>/)) {
                    enabled = true;
                    isDodge = true;
                }
            }
        }
        else {
            if (item && item.note) {
                note = item.note;
                if (note.match(/<FNQTE_Group:(\d+)>/)) {
                    enabled = true;
                }
                if (note.match(/<FNQTE_Dodge_Group:(\d+)>/)) {
                    enabled = true;
                    isDodge = true;
                }
            }
        }
        if (!enabled) {
            return { enabled: false };
        }
        const data = { enabled: true, isDodge: isDodge, groupName: null, indicatorNames: null, chance: 100, width: null, speed: null, reverse: false, times: null, magnetic: null, accel: null, hallucination: false, damageSegments: 1, segmentIndicators: [], realTimeMode: true, interval: 0 };
        if (note.match(/<FNQTE_Group:(\d+)>/)) {
            data.groupName = parseInt(RegExp.$1);
        }
        if (note.match(/<FNQTE_Dodge_Group:(\d+)>/)) {
            data.groupName = parseInt(RegExp.$1);
        }
        if (note.match(/<FNQTE_Chance:(\d+)>/)) {
            data.chance = parseInt(RegExp.$1);
        }
        if (note.match(/<FNQTE_Width:(\d+)>/)) {
            data.width = parseInt(RegExp.$1);
        }
        if (note.match(/<FNQTE_Speed:([\d.]+)>/)) {
            data.speed = parseFloat(RegExp.$1);
        }
        if (note.includes('<FNQTE_Reverse>')) {
            data.reverse = true;
        }
        if (note.match(/<FNQTE_Times:(\d+)>/)) {
            data.times = parseInt(RegExp.$1);
        }
        if (note.match(/<FNQTE_Magnetic:([\d.]+)>/)) {
            data.magnetic = parseFloat(RegExp.$1);
        }
        if (note.match(/<FNQTE_Accel:([\d.]+)>/)) {
            data.accel = parseFloat(RegExp.$1);
        }
        if (note.includes('<FNQTE_Hallucination>')) {
            data.hallucination = true;
        }
        if (note.match(/<FNQTE_DamageSegments:(\d+)>/)) {
            data.damageSegments = parseInt(RegExp.$1);
        }
        if (note.match(/<FNQTE_Segments_Indicators:(.+)>/)) {
            const segmentStr = RegExp.$1;
            const segments = segmentStr.split(',');
            for (let i = 0; i < segments.length; i++) {
                data.segmentIndicators.push(parseInt(segments[i].trim()));
            }
        }
        if (note.includes('<FNQTE_RealTime>')) {
            data.realTimeMode = true;
        }
        if (note.includes('<FNQTE_NoRealTime>')) {
            data.realTimeMode = false;
        }
        return data;
    };
    fnyoat.QTE.createIndicators = function (qteData) {
        const indicators = [];
        let indicatorList = [];
        if (qteData.groupName) {
            const group = this.getGroup(qteData.groupName);
            if (group) {
                qteData.interval = group.interval || 0;
                const names = group.indicators.split(',');
                for (let i = 0; i < names.length; i++) {
                    const config = this.getIndicator(names[i].trim());
                    if (config) {
                        indicatorList.push(config);
                    }
                }
            }
        }
        else if (qteData.indicatorNames) {
            for (let i = 0; i < qteData.indicatorNames.length; i++) {
                const config = this.getIndicator(qteData.indicatorNames[i].trim());
                if (config) {
                    indicatorList.push(config);
                }
            }
        }
        if (indicatorList.length === 0) {
            const defaultNames = this._params.defaultGroupIndicators.split(',');
            for (let i = 0; i < defaultNames.length; i++) {
                const config = this.getIndicator(defaultNames[i].trim());
                if (config) {
                    indicatorList.push(config);
                }
            }
        }
        const times = qteData.times || this._params.defaultGroupTimes;
        const damageSegments = qteData.damageSegments || 1;
        const segmentIndicators = qteData.segmentIndicators || [];
        let segmentIndex = 0;
        let currentSegmentIndicator = 0;
        let indicatorsPerSegment = segmentIndicators.length > 0 ? segmentIndicators[0] : Math.ceil(indicatorList.length / damageSegments);
        for (let i = 0; i < indicatorList.length; i++) {
            const baseConfig = indicatorList[i];
            const config = {
                name: baseConfig.name, key: baseConfig.key, color: baseConfig.color,
                width: qteData.width || baseConfig.width, height: baseConfig.height,
                speed: qteData.speed || baseConfig.speed,
                direction: qteData.reverse ? this.getReverseDirection(baseConfig.direction) : baseConfig.direction,
                times: times, magnetic: qteData.magnetic !== null ? qteData.magnetic : baseConfig.magnetic,
                magneticStrength: qteData.magnetic !== null ? qteData.magnetic : baseConfig.magneticStrength,
                antiMagnetic: baseConfig.antiMagnetic, antiMagneticStrength: baseConfig.antiMagneticStrength,
                accel: qteData.accel !== null ? qteData.accel : baseConfig.accel,
                hallucination: qteData.hallucination || baseConfig.hallucination,
                reversed: qteData.reverse || false, segment: segmentIndex
            };
            indicators.push(new this.Indicator(config));
            currentSegmentIndicator++;
            if (segmentIndicators.length > 0 && currentSegmentIndicator >= segmentIndicators[segmentIndex]) {
                segmentIndex++;
                currentSegmentIndicator = 0;
                if (segmentIndex < segmentIndicators.length) {
                    indicatorsPerSegment = segmentIndicators[segmentIndex];
                }
            }
            else if (segmentIndicators.length === 0 && currentSegmentIndicator >= indicatorsPerSegment) {
                segmentIndex++;
                currentSegmentIndicator = 0;
            }
        }
        return indicators;
    };
    fnyoat.QTE.getReverseDirection = function (dir) {
        switch (dir) {
            case 'rightToLeft': return 'leftToRight';
            case 'leftToRight': return 'rightToLeft';
            case 'topToBottom': return 'bottomToTop';
            case 'bottomToTop': return 'topToBottom';
            default: return dir;
        }
    };
    fnyoat.QTE.getBattlerSprite = function (battler) {
        if (!battler)
            return null;
        const spriteset = SceneManager._scene._spriteset;
        if (spriteset && spriteset._battlerSprites) {
            for (let i = 0; i < spriteset._battlerSprites.length; i++) {
                const sprite = spriteset._battlerSprites[i];
                if (sprite && sprite._battler === battler) {
                    return sprite;
                }
            }
        }
        return null;
    };
    fnyoat.QTE.setupJudgmentArea = function () {
        this._judgmentArea = new this.JudgmentArea();
        let targets = null;
        if (this._currentAction && typeof this._currentAction.targets === 'function') {
            targets = this._currentAction.targets();
        }
        const target = targets ? targets[0] : null;
        const sprite = target ? this.getBattlerSprite(target) : null;
        if (sprite) {
            const position = this._params.defaultPosition;
            switch (position) {
                case 'left':
                    this._judgmentArea.x = sprite.x - this._judgmentArea.width - 50;
                    this._judgmentArea.y = sprite.y - this._judgmentArea.height / 2;
                    break;
                case 'right':
                    this._judgmentArea.x = sprite.x + sprite.width + 50;
                    this._judgmentArea.y = sprite.y - this._judgmentArea.height / 2;
                    break;
                case 'top':
                    this._judgmentArea.x = sprite.x - this._judgmentArea.width / 2;
                    this._judgmentArea.y = sprite.y - this._judgmentArea.height - 50;
                    break;
                case 'bottom':
                    this._judgmentArea.x = sprite.x - this._judgmentArea.width / 2;
                    this._judgmentArea.y = sprite.y + sprite.height + 50;
                    break;
                case 'center':
                    this._judgmentArea.x = Graphics.width / 2 - this._judgmentArea.width / 2;
                    this._judgmentArea.y = Graphics.height / 2 - this._judgmentArea.height / 2;
                    break;
            }
        }
        else {
            this._judgmentArea.x = Graphics.width / 2 - this._judgmentArea.width / 2;
            this._judgmentArea.y = Graphics.height / 2 - this._judgmentArea.height / 2;
        }
    };
    fnyoat.QTE.createSprites = function () {
        this._sprites = {};
        this._sprites.container = new Sprite();
        SceneManager._scene.addChild(this._sprites.container);
        this._sprites.judgment = new Sprite();
        this._sprites.judgment.bitmap = new Bitmap(this._judgmentArea.width, this._judgmentArea.height);
        this._sprites.judgment.x = this._judgmentArea.x;
        this._sprites.judgment.y = this._judgmentArea.y;
        this._sprites.container.addChild(this._sprites.judgment);
        this.drawJudgmentArea();
        this._sprites.indicators = [];
        this._indicators.forEach(function (indicator, index) {
            const sprite = new Sprite();
            sprite.bitmap = new Bitmap(indicator.width, indicator.height);
            sprite.indicator = indicator;
            sprite.index = index;
            sprite.x = indicator.x - indicator.width / 2;
            sprite.y = indicator.y - indicator.height / 2;
            sprite.opacity = 255;
            this.drawIndicator(sprite.bitmap, indicator);
            this._sprites.indicators.push(sprite);
            this._sprites.container.addChild(sprite);
            indicator.sprite = sprite;
        }, this);
        this._sprites.stars = new Sprite();
        this._sprites.stars.bitmap = new Bitmap(Graphics.width, Graphics.height);
        this._sprites.stars.x = 0;
        this._sprites.stars.y = 0;
        this._sprites.container.addChild(this._sprites.stars);
    };
    fnyoat.QTE.drawStrokeRect = function (bitmap, x, y, width, height, color, lineWidth) {
        lineWidth = lineWidth || 2;
        const oldAlpha = bitmap.context.globalAlpha;
        bitmap.context.globalAlpha = oldAlpha;
        bitmap.context.strokeStyle = color;
        bitmap.context.lineWidth = lineWidth;
        bitmap.context.strokeRect(x, y, width, height);
        bitmap.context.globalAlpha = oldAlpha;
        bitmap._dirty = true;
    };
    fnyoat.QTE.drawFillCircle = function (bitmap, x, y, radius, color) {
        const oldAlpha = bitmap.context.globalAlpha;
        bitmap.context.globalAlpha = oldAlpha;
        bitmap.context.fillStyle = color;
        bitmap.context.beginPath();
        bitmap.context.arc(x, y, radius, 0, Math.PI * 2);
        bitmap.context.fill();
        bitmap.context.globalAlpha = oldAlpha;
        bitmap._dirty = true;
    };
    fnyoat.QTE.drawJudgmentArea = function () {
        if (!this._sprites || !this._sprites.judgment)
            return;
        const bitmap = this._sprites.judgment.bitmap;
        const area = this._judgmentArea;
        bitmap.fillRect(0, 0, area.width, area.height, area.color);
        this.drawStrokeRect(bitmap, 0, 0, area.width, area.height, area.borderColor, 3);
        const centerX = area.width / 2;
        const centerY = area.height / 2;
        this.drawFillCircle(bitmap, centerX, centerY, 8, 'rgba(255, 255, 0, 0.8)');
        const currentIndicator = this._indicators[this._activeIndicatorIndex];
        const perfectBoxWidth = currentIndicator ? currentIndicator.width : 40;
        const perfectBoxHeight = currentIndicator ? currentIndicator.height : 40;
        this.drawStrokeRect(bitmap, centerX - perfectBoxWidth / 2, centerY - perfectBoxHeight / 2, perfectBoxWidth, perfectBoxHeight, 'rgba(255, 215, 0, 1)', 2);
    };
    fnyoat.QTE.handleKeyPress = function (keyCode) {
        if (!this._processing || !this._judgmentArea || !this._sprites)
            return;
        if (this._handlingKey)
            return;
        this._handlingKey = true;
        const savedIndex = this._activeIndicatorIndex;
        const currentIndicator = this._indicators[savedIndex];
        if (!currentIndicator) {
            this._handlingKey = false;
            return;
        }
        if (currentIndicator.key === keyCode) {
            const hit = currentIndicator.checkHit(this._judgmentArea);
            if (hit) {
                if (currentIndicator.hitType === 'perfect') {
                    AudioManager.playSe({ name: this._params.perfectHitSound, volume: 90, pitch: 100, pan: 0 });
                    this._perfectHitFlash = 30;
                    this.spawnPerfectHitStars();
                    this._result.damageBonus += this._params.baseAccuracyBonus / 100;
                    this._result.hitRateMod += 0.25;
                }
                else {
                    AudioManager.playSe({ name: this._params.confirmSound, volume: 90, pitch: 100, pan: 0 });
                    this._result.damageBonus += (currentIndicator.accuracy - 60) / 100 * 0.5;
                    this._result.hitRateMod += (currentIndicator.accuracy - 60) / 100 * 0.15;
                }
                this._result.hitCount++;
                currentIndicator.startFadeOut();
                this.nextIndicator();
            }
            else {
                currentIndicator.hit = true;
                currentIndicator.hitType = 'miss';
                currentIndicator.startFadeOut();
                AudioManager.playSe({ name: this._params.missSound, volume: 90, pitch: 100, pan: 0 });
                this.nextIndicator();
            }
        }
        else {
            for (let i = 0; i < this._indicators.length; i++) {
                if (i === savedIndex)
                    continue;
                if (this._indicators[i].key === keyCode && !this._indicators[i].hit && !this._indicators[i].passed) {
                    this._indicators[i].hit = true;
                    this._indicators[i].hitType = 'miss';
                    this._indicators[i].startFadeOut();
                    AudioManager.playSe({ name: this._params.missSound, volume: 90, pitch: 100, pan: 0 });
                }
            }
        }
        this._handlingKey = false;
    };
    fnyoat.QTE.spawnPerfectHitStars = function () {
        const indicator = this._indicators[this._activeIndicatorIndex];
        if (!indicator || !indicator.sprite)
            return;
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const star = new this.StarParticle(indicator.x, indicator.y);
            this._stars.push(star);
        }
    };
    fnyoat.QTE.nextIndicator = function () {
        if (!this._sprites)
            return;
        this._activeIndicatorIndex++;
        this._waitTimer = 0;
        if (this._activeIndicatorIndex >= this._indicators.length) {
            this.endQTE();
        }
        else {
            this._indicators[this._activeIndicatorIndex].sprite.opacity = 255;
            this._indicators[this._activeIndicatorIndex].fadeProgress = 1;
            this._indicators[this._activeIndicatorIndex].active = true;
            this.drawJudgmentArea();
        }
    };
    fnyoat.QTE.checkNextIndicator = function () {
        if (!this._sprites)
            return;
        if (this._indicatorInterval > 0) {
            this._intervalTimer++;
            const intervalFrames = Math.floor(this._indicatorInterval * 60);
            if (this._intervalTimer >= intervalFrames && this._activeIndicatorIndex < this._indicators.length - 1) {
                const nextIndicator = this._indicators[this._activeIndicatorIndex + 1];
                if (!nextIndicator.passed && !nextIndicator.hit) {
                    nextIndicator.sprite.opacity = 255;
                    nextIndicator.fadeProgress = 1;
                    nextIndicator.active = true;
                    this._intervalTimer = 0;
                }
            }
        }
    };
    fnyoat.QTE.endQTE = function () {
        this._processing = false;
        this._started = false;
        this._cleaningUp = true;
        if (this._result.hitCount > 0) {
            this._result.success = true;
        }
        this.calculateFinalResult();
        const result = this._result;
        if (result.accuracy === 0) {
            result.hitRateMod = this._params.minHitRate / 100;
        }
        if (this._currentAction) {
            this._currentAction._qteResult = result;
            this._currentAction._qteDamageBonus = result.damageBonus;
            this._currentAction._qteHitRateMod = result.hitRateMod;
            this._currentAction._qteSuccess = result.success;
        }
        BattleManager._qteResult = result;
        this._activeIndicatorIndex = 0;
        this._intervalTimer = 0;
    };
    fnyoat.QTE.calculateFinalResult = function () {
        if (this._result.totalCount > 0) {
            this._result.accuracy = (this._result.hitCount / this._result.totalCount) * 100;
        }
        this._result.hitRateMod = Math.max(0, Math.min(this._result.hitRateMod, 3));
        this._result.damageBonus = Math.max(0, Math.min(this._result.damageBonus, 2));
    };
    fnyoat.QTE.removeSprites = function () {
        if (this._sprites) {
            if (this._sprites.container && this._sprites.container.parent) {
                this._sprites.container.parent.removeChild(this._sprites.container);
            }
            this._sprites = null;
        }
    };
    fnyoat.QTE.stop = function () {
        this._processing = false;
        this._started = false;
        this._cleaningUp = false;
        this._lastAction = null;
        this.removeSprites();
        this._indicators = [];
        this._stars = [];
        this._currentAction = null;
        this._result = null;
    };
    fnyoat.QTE.result = function () {
        return this._result;
    };
    fnyoat.QTE.setActive = function (active) {
        this._active = active;
    };
    fnyoat.QTE.isProcessing = function () {
        return this._processing && this._sprites !== null;
    };
    fnyoat.QTE.isDodge = function () {
        return this._isDodge;
    };
    fnyoat.QTE.drawIndicator = function (bitmap, indicator) {
        bitmap.clear();
        if (this._params.glowEffect) {
            bitmap.fillRect(-5, -5, bitmap.width + 10, bitmap.height + 10, this._params.glowColor);
        }
        bitmap.fillRect(0, 0, bitmap.width, bitmap.height, indicator.color);
        this.drawStrokeRect(bitmap, 0, 0, bitmap.width, bitmap.height, 'rgba(0, 0, 0, 0.5)', 2);
        const centerX = bitmap.width / 2;
        const centerY = bitmap.height / 2;
        this.drawFillCircle(bitmap, centerX, centerY, 5, 'rgba(0, 0, 0, 0.3)');
    };
    fnyoat.QTE.update = function () {
        if (this._cleaningUp) {
            if (this._sprites && this._sprites.judgment) {
                this._judgmentFadeProgress = (this._judgmentFadeProgress || 0) + 0.1;
                const judgmentOpacity = Math.max(0, 1 - this._judgmentFadeProgress);
                this._sprites.judgment.opacity = judgmentOpacity * 255;
            }
            let allDone = true;
            this._indicators.forEach(function (indicator) {
                if (indicator.physics) {
                    indicator.update(this._judgmentArea);
                    if (indicator.physics) {
                        allDone = false;
                    }
                }
            }, this);
            if (this._stars.length > 0) {
                allDone = false;
            }
            this._stars.forEach(function (star) { star.update(); });
            this._stars = this._stars.filter(function (star) { return !star.gone; });
            if (this._sprites && this._sprites.stars) {
                const starsBitmap = this._sprites.stars.bitmap;
                starsBitmap.clear();
                this._stars.forEach(function (star) { star.draw(starsBitmap); });
                starsBitmap._dirty = true;
            }
            if (allDone) {
                this._cleaningUp = false;
                this.removeSprites();
            }
            return;
        }
        if (!this._processing || !this._judgmentArea || !this._sprites)
            return;
        if (this._startDelay && this._startDelay > 0) {
            this._startDelay--;
            this.updateSprites();
            return;
        }
        this._alertTimer = (this._alertTimer || 0) + 1;
        if (this._params.enableAlertSound && this._alertTimer >= this._params.alertInterval) {
            this._alertTimer = 0;
        }
        this._indicators.forEach(function (indicator) { indicator.update(this._judgmentArea); }, this);
        const currentIndicator = this._indicators[this._activeIndicatorIndex];
        if (currentIndicator) {
            if (currentIndicator.passed && !currentIndicator.hit) {
                this.nextIndicator();
            }
        }
        this.checkNextIndicator();
        if (this._perfectHitFlash > 0) {
            this._perfectHitFlash--;
            if (this._perfectHitFlash > 0) {
                this.updatePerfectHitFlash();
            }
            else {
                this.drawJudgmentArea();
            }
        }
        this._stars.forEach(function (star) { star.update(); });
        this._stars = this._stars.filter(function (star) { return !star.gone; });
        if (this._sprites && this._sprites.stars) {
            const starsBitmap = this._sprites.stars.bitmap;
            starsBitmap.clear();
            this._stars.forEach(function (star) { star.draw(starsBitmap); });
            starsBitmap._dirty = true;
        }
        this.updateSprites();
    };
    fnyoat.QTE.updateSprites = function () {
        if (!this._sprites || !this._sprites.indicators)
            return;
        this._sprites.indicators.forEach(function (sprite) {
            const indicator = sprite.indicator;
            if (!indicator.physics) {
                sprite.x = indicator.x - indicator.width / 2;
                sprite.y = indicator.y - indicator.height / 2;
            }
        }, this);
    };
    fnyoat.QTE.updatePerfectHitFlash = function () {
        if (!this._sprites || !this._sprites.judgment)
            return;
        const flash = Math.sin(this._perfectHitFlash * 0.5) > 0;
        const bitmap = this._sprites.judgment.bitmap;
        const area = this._judgmentArea;
        bitmap.clear();
        bitmap.fillRect(0, 0, area.width, area.height, area.color);
        this.drawStrokeRect(bitmap, 0, 0, area.width, area.height, area.borderColor, 3);
        const centerX = area.width / 2;
        const centerY = area.height / 2;
        this.drawFillCircle(bitmap, centerX, centerY, 8, 'rgba(255, 255, 0, 0.8)');
        const currentIndicator = this._indicators[this._activeIndicatorIndex];
        const perfectBoxWidth = currentIndicator ? currentIndicator.width : 40;
        const perfectBoxHeight = currentIndicator ? currentIndicator.height : 40;
        this.drawStrokeRect(bitmap, centerX - perfectBoxWidth / 2, centerY - perfectBoxHeight / 2, perfectBoxWidth, perfectBoxHeight, flash ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 1)', 2);
    };
    const _Scene_Battle_create = Scene_Battle.prototype.create;
    Scene_Battle.prototype.create = function () {
        _Scene_Battle_create.call(this);
        this._qteKeyHandler = this.onQTEKeyDown.bind(this);
        this.setupQTEListeners();
    };
    Scene_Battle.prototype.setupQTEListeners = function () {
        document.addEventListener('keydown', this._qteKeyHandler);
    };
    Scene_Battle.prototype.onQTEKeyDown = function (event) {
        if (fnyoat.QTE.isProcessing()) {
            const keyCode = event.keyCode || event.which;
            fnyoat.QTE.handleKeyPress(keyCode);
        }
    };
    const _Scene_Battle_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function () {
        if (this._qteKeyHandler) {
            document.removeEventListener('keydown', this._qteKeyHandler);
        }
        _Scene_Battle_terminate.call(this);
    };
    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function () {
        _Scene_Battle_update.call(this);
        fnyoat.QTE.update();
    };
    const _Window_BattleLog_updateWaitMode = Window_BattleLog.prototype.updateWaitMode;
    Window_BattleLog.prototype.updateWaitMode = function () {
        if (this._waitMode === 'qte') {
            if (fnyoat.QTE.isProcessing())
                return true;
            this._waitMode = '';
        }
        return _Window_BattleLog_updateWaitMode.call(this);
    };
    const _BattleManager_startAction = BattleManager.startAction;
    BattleManager.prepareQTE = function () {
        const subject = this._subject;
        if (!subject)
            return;
        const action = subject.currentAction();
        if (!action)
            return;
        if (fnyoat.QTE._lastAction === action)
            return;
        const item = action.item();
        if (!item)
            return;
        const qteResult = fnyoat.QTE.start(action);
        if (qteResult) {
            this._qteWaiting = true;
            this._logWindow.setWaitMode('qte');
        }
    };
    BattleManager.startAction = function () {
        BattleManager.prepareQTE.call(this);
        _BattleManager_startAction.call(this);
    };
    const _BattleManager_isBusy = BattleManager.isBusy;
    BattleManager.isBusy = function () {
        return fnyoat.QTE.isProcessing() || _BattleManager_isBusy.call(this);
    };
    const _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function () {
        if (fnyoat.QTE.isProcessing()) {
            fnyoat.QTE.stop();
        }
        BattleManager._qteResult = null;
        _BattleManager_endAction.call(this);
    };
    const _Game_Action_evalDamageFormula = Game_Action.prototype.evalDamageFormula;
    Game_Action.prototype.evalDamageFormula = function (target) {
        const value = _Game_Action_evalDamageFormula.call(this, target);
        const qteResult = BattleManager._qteResult;
        if (qteResult && qteResult.damageBonus && qteResult.damageBonus > 0) {
            return Math.floor(value * (1 + qteResult.damageBonus));
        }
        if (this._qteDamageBonus && this._qteDamageBonus > 0) {
            return Math.floor(value * (1 + this._qteDamageBonus));
        }
        return value;
    };
    const _Game_Action_itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function (target) {
        const baseHit = _Game_Action_itemHit.call(this, target);
        const qteResult = BattleManager._qteResult;
        if (qteResult && qteResult.accuracy === 0) {
            return Math.max(0, Math.min(1, baseHit * (qteResult.hitRateMod || 0.2)));
        }
        if (this._qteHitRateMod && this._qteHitRateMod !== 1) {
            return Math.min(1, baseHit * this._qteHitRateMod);
        }
        return baseHit;
    };
    const _Game_Action_calcDamage = Game_Action.prototype.calcDamage;
    Game_Action.prototype.calcDamage = function (target) {
        let damage = _Game_Action_calcDamage.call(this, target);
        if (this._qteSuccess && this._qteDamageBonus > 0) {
            damage = Math.floor(damage * (1 + this._qteDamageBonus));
        }
        return damage;
    };
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        if (command.toLowerCase() === 'fnyoatqte') {
            const subCommand = (args[0] || '').toLowerCase();
            switch (subCommand) {
                case 'start':
                    fnyoat.QTE.setActive(true);
                    break;
                case 'stop':
                    fnyoat.QTE.stop();
                    break;
                case 'active':
                    fnyoat.QTE.setActive(true);
                    break;
                case 'inactive':
                    fnyoat.QTE.setActive(false);
                    break;
            }
        }
        else {
            _Game_Interpreter_pluginCommand.call(this, command, args);
        }
    };
})();
